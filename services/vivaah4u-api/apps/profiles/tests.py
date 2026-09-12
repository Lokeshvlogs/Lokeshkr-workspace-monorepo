"""Tests pinning the profile-completeness invariants.

These exist because completeness is load-bearing in a way that is easy to break
silently: it decides whether a member appears in match results and whether login
bounces them back into the registration wizard. There is exactly one slot of
headroom at the 95% threshold, so adding a single scored field to the core set
drops every member currently sitting at 97% out of the product.

Run with:  service.bat vivaah4u-api test
"""

import json
from types import SimpleNamespace
from datetime import timedelta

from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from ninja.errors import HttpError
from django.test import TestCase
from django.utils import timezone

from apps.catalog.models import Employer, Institution

from apps.profiles.constants import (
    MAX_PICK_SUBTITLE,
    MAX_PICK_TITLE,
    MAX_PICKS,
    PROFILE_COMPLETE_THRESHOLD,
)
from apps.profiles.mapping import (
    MAX_LIST_ITEMS,
    MAX_LIST_VALUE_LENGTH,
    apply_payload,
    profile_to_api,
)
from apps.profiles import managed_by as managed_by_rules
from apps.profiles.education import NO_REPUTATION, rank_of
from apps.profiles.models import (
    Block,
    FamilyMember,
    Interest,
    Profile,
    ProfileEducation,
    ProfileView,
    interest_pair_key,
)
from apps.auth_api.api import derive_gender
from apps.profiles import identity, interests, presence
from apps.profiles.api import (
    LAST_WIZARD_STEP,
    RECENTLY_JOINED_DAYS,
    eligible_matches,
    match_queryset,
    new_match_queryset,
    recent_match_queryset,
    visitor_rows,
    trending_queryset,
    update_profile_step,
    TRENDING_WINDOW_DAYS,
)
from apps.profiles.verification import VerificationLevel

# Every core field with a value that counts as answered. Kept explicit rather
# than generated, so that adding a core field makes this test fail loudly
# instead of quietly adjusting itself.
FULLY_ANSWERED = {
    "first_name": "Asha",
    "surname": "Rao",
    "religion": "hindu",
    "community": "nair",
    "mother_tongue": "Malayalam",
    "current_country": "IN",
    "current_city": "Kochi, Kerala, India",
    "place_of_birth_country": "IN",
    "place_of_birth_city": "Kochi, Kerala, India",
    "citizenship_country": "IN",
    "family_living_in_country": "IN",
    "family_living_in_city": "Kochi, Kerala, India",
    "family_income": "10-15",
    "education_level": "masters",
    "field_of_study": "engineering",
    "college_university": "iit_bombay",
    "profession": "software_engineer",
    "employed_in": "private",
    "employed_as": "senior_management",
    "annual_income": "25-50",
    "diet": "vegetarian",
    "smoking_habits": "non_smoker",
    "drinking_habits": "non_drinker",
    "body_physique": "athletic",
    "religiosity": "spiritual",
    "height_feet": 5,
    "age": 29,
    "gender": "F",
}

# The fields beyond the core set. These move the headline percentage and nothing
# else - see Profile.EXTRA_TEXT_FIELDS / EXTRA_LIST_FIELDS.
EXTRA_ANSWERED = {
    "daily_routine": "early_riser",
    "settle_abroad": "open",
    "current_state": "Kerala",
    "place_of_birth_state": "Kerala",
    "family_living_in_state": "Kerala",
    "interests_music": ["ghazal"],
    "interests_movies": ["comedy"],
    "interests_books": ["poetry"],
    "interests_cuisines": ["south_indian"],
    "interests_travel": ["mountains"],
    "interests_hobbies": ["cooking"],
}


class CompletenessTests(TestCase):
    def setUp(self):
        # A post_save signal on User creates the Profile.
        self.user = User.objects.create_user(username="asha", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def _fill(self, omit=(), extras=False):
        """Fill the core set. `extras` adds everything beyond it."""
        source = {**FULLY_ANSWERED, **(EXTRA_ANSWERED if extras else {})}
        for field, value in source.items():
            if field not in omit:
                setattr(self.profile, field, value)
        # dob_time is the 29th slot; display_picture is skipped deliberately -
        # see test_display_picture_is_the_last_slot.
        if "dob_time" not in omit:
            from django.utils import timezone

            self.profile.dob_time = timezone.now()

    def test_core_denominator_is_29(self):
        """The core field set is frozen. Changing it moves every member at once.

        If this fails you have added or removed a core field. That is a
        migration-grade change: run `check_profile_drift` and confirm no
        member's eligibility flips before updating this number. New fields
        belong in EXTRA_TEXT_FIELDS / EXTRA_LIST_FIELDS, which do not affect
        eligibility.
        """
        self.assertEqual(self.profile._core_total(), 29)

    def test_empty_profile_scores_zero_and_is_not_complete(self):
        # A brand new profile has gender defaulted to "M", so it is not truly
        # empty - one slot is already filled.
        self.assertLess(self.profile.compute_completeness(), 10)
        self.assertFalse(self.profile.is_complete)

    def test_fully_answered_profile_reaches_100(self):
        """100% now means every field the wizard asks for, core and extra."""
        self._fill(extras=True)
        self.profile.display_picture = "profile_pics/x.jpg"
        self.assertEqual(self.profile.compute_completeness(), 100)
        self.assertEqual(self.profile.core_completeness(), 100)
        self.assertTrue(self.profile.is_complete)

    def test_one_missing_field_still_counts_as_complete(self):
        """28/29 = 97% clears the 95 threshold.

        This single slot of headroom is why the core list must stay frozen: one
        added field turns 28/29 into 28/30 = 93%, which does not clear it.
        """
        self._fill()  # display_picture left unset -> 28 of 29
        self.assertEqual(self.profile.core_completeness(), 97)
        self.assertGreaterEqual(self.profile.core_completeness(), PROFILE_COMPLETE_THRESHOLD)
        self.assertTrue(self.profile.is_complete)

    def test_two_missing_fields_is_not_complete(self):
        self._fill(omit=("religiosity",))  # and no display_picture -> 27 of 29
        self.assertEqual(self.profile.core_completeness(), 93)
        self.assertFalse(self.profile.is_complete)

    def test_extra_fields_do_not_affect_eligibility(self):
        """The headline percentage may fall; `is_complete` must not follow it.

        This is the guarantee that lets later phases add fields freely.
        """
        self._fill()
        self.profile.display_picture = "profile_pics/x.jpg"
        self.assertTrue(self.profile.is_complete)

        # Simulate a later phase adding unanswered extra fields.
        original = Profile.EXTRA_TEXT_FIELDS
        try:
            Profile.EXTRA_TEXT_FIELDS = ["about_me", "family_about", "partner_about"]
            self.assertLess(self.profile.compute_completeness(), 100)
            self.assertEqual(self.profile.core_completeness(), 100)
            self.assertTrue(self.profile.is_complete)
        finally:
            Profile.EXTRA_TEXT_FIELDS = original


class VerificationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="meera", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def _complete(self):
        for field, value in {**FULLY_ANSWERED, **EXTRA_ANSWERED}.items():
            setattr(self.profile, field, value)
        from django.utils import timezone

        self.profile.dob_time = timezone.now()
        self.profile.display_picture = "profile_pics/x.jpg"

    def test_unverified_phone_is_level_none(self):
        self._complete()
        self.profile.phone_verified = False
        self.profile.save()
        self.assertEqual(self.profile.verification_level, VerificationLevel.NONE)

    def test_phone_verified_alone_is_basic(self):
        self.profile.phone_verified = True
        self.profile.save()
        self.assertEqual(self.profile.verification_level, VerificationLevel.BASIC)

    def test_complete_profile_reaches_complete_not_id_verified(self):
        """100% earns the 'Complete' badge - never the identity tick.

        Completeness certifies diligence, which a fraudster can supply in ten
        minutes. Only a document check may reach ID_VERIFIED.
        """
        self._complete()
        self.profile.phone_verified = True
        self.profile.save()
        self.assertEqual(self.profile.verification_level, VerificationLevel.COMPLETE)
        self.assertLess(self.profile.verification_level, VerificationLevel.ID_VERIFIED)

    def test_ninety_seven_percent_is_not_complete_badge(self):
        """The badge wants a true 100%, unlike the 95% eligibility bar."""
        self._complete()
        self.profile.display_picture = ""  # 28 of 29
        self.profile.phone_verified = True
        self.profile.save()
        self.assertTrue(self.profile.is_complete)  # still eligible for matches
        self.assertEqual(self.profile.verification_level, VerificationLevel.BASIC)

    def test_id_document_outranks_everything(self):
        self.profile.phone_verified = False
        self.profile.id_document_verified = True
        self.profile.save()
        self.assertEqual(self.profile.verification_level, VerificationLevel.ID_VERIFIED)

    def test_verified_at_is_stamped_once_and_never_cleared(self):
        self._complete()
        self.profile.phone_verified = True
        self.profile.save()
        stamped = self.profile.verified_at
        self.assertIsNotNone(stamped)

        # Dropping back below the bar keeps the original timestamp.
        self.profile.religiosity = ""
        self.profile.body_physique = ""
        self.profile.save()
        self.assertLess(self.profile.verification_level, VerificationLevel.COMPLETE)
        self.assertEqual(self.profile.verified_at, stamped)

    def test_level_survives_save_with_update_fields(self):
        """The update_fields fix has to cover verification, not just completeness.

        Without it, change_phone in auth_api recomputes the badge and then does
        not write it.
        """
        self._complete()
        self.profile.phone_verified = True
        self.profile.save(update_fields=["phone_verified"])

        fresh = Profile.objects.get(pk=self.profile.pk)
        self.assertEqual(fresh.verification_level, VerificationLevel.COMPLETE)


class MultiValuePayloadTests(TestCase):
    """The write path for JSON list columns.

    These columns are the first place a client can put arbitrary structure into
    the database, so the normalising in `_to_str_list` is a boundary, not a
    convenience.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="arjun", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def test_list_round_trips(self):
        apply_payload(self.profile, {"partnerReligions": ["hindu", "jain"]})
        self.assertEqual(self.profile.partner_religions, ["hindu", "jain"])

    def test_any_is_never_stored(self):
        """"No preference" has one representation: the empty list."""
        apply_payload(self.profile, {"partnerReligions": ["any", "hindu"]})
        self.assertEqual(self.profile.partner_religions, ["hindu"])

        apply_payload(self.profile, {"partnerDiets": ["any"]})
        self.assertEqual(self.profile.partner_diets, [])

    def test_duplicates_and_blanks_are_dropped(self):
        apply_payload(self.profile, {"partnerReligions": ["hindu", "hindu", "", None, " jain "]})
        self.assertEqual(self.profile.partner_religions, ["hindu", "jain"])

    def test_bare_string_is_accepted(self):
        """An un-redeployed client may still send the singular shape."""
        apply_payload(self.profile, {"partnerReligions": "hindu"})
        self.assertEqual(self.profile.partner_religions, ["hindu"])

    def test_empty_list_clears_rather_than_being_skipped(self):
        apply_payload(self.profile, {"partnerReligions": ["hindu"]})
        apply_payload(self.profile, {"partnerReligions": []})
        self.assertEqual(self.profile.partner_religions, [])

    def test_list_length_is_capped(self):
        """Validators are never enforced, so the cap has to live here."""
        apply_payload(self.profile, {"partnerCommunities": [str(i) for i in range(40)]})
        self.assertEqual(len(self.profile.partner_communities), MAX_LIST_ITEMS)

    def test_value_length_is_capped(self):
        apply_payload(self.profile, {"partnerCommunities": ["x" * 500]})
        self.assertEqual(len(self.profile.partner_communities[0]), MAX_LIST_VALUE_LENGTH)

    def test_wrong_shape_is_rejected_not_coerced(self):
        with self.assertRaises(ValueError):
            apply_payload(self.profile, {"partnerReligions": {"a": 1}})

    def test_explicit_null_clears_a_nullable_int(self):
        """Previously impossible: None meant "absent" for every field."""
        self.profile.partner_age_min = 25
        apply_payload(self.profile, {"partnerAgeMin": None})
        self.assertIsNone(self.profile.partner_age_min)

    def test_null_still_means_absent_for_ordinary_fields(self):
        """The wizard PATCHes one step at a time; null must not blank the rest."""
        self.profile.first_name = "Arjun"
        apply_payload(self.profile, {"firstName": None})
        self.assertEqual(self.profile.first_name, "Arjun")

    def test_payload_carries_both_shapes(self):
        apply_payload(self.profile, {"partnerReligions": ["hindu"]})
        data = profile_to_api(self.profile, None, public=True)
        self.assertEqual(data["partnerReligions"], ["hindu"])
        # Singular kept for one release so an older client does not break.
        self.assertIn("partnerReligion", data)


class SaveTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ravi", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def test_save_with_update_fields_persists_completeness(self):
        """`save(update_fields=[...])` must not discard the recompute.

        Three callers in auth_api save with an explicit field list. Before the
        fix, completeness was recomputed in memory and then never written, so a
        member who changed their phone number kept a stale percentage forever.
        """
        self.profile.first_name = "Ravi"
        self.profile.surname = "Kumar"
        self.profile.save()
        baseline = self.profile.profile_completeness

        self.profile.religion = "hindu"
        self.profile.community = "nair"
        self.profile.save(update_fields=["religion", "community"])

        fresh = Profile.objects.get(pk=self.profile.pk)
        self.assertGreater(fresh.profile_completeness, baseline)
        self.assertEqual(fresh.profile_completeness, fresh.compute_completeness())

    def test_save_without_update_fields_still_works(self):
        self.profile.first_name = "Ravi"
        self.profile.save()
        fresh = Profile.objects.get(pk=self.profile.pk)
        self.assertEqual(fresh.profile_completeness, fresh.compute_completeness())


class EducationTests(TestCase):
    """The education history and the rules that derive from it."""

    @classmethod
    def setUpTestData(cls):
        cls.elite = Institution.objects.create(
            slug="elite_in", name="Elite Institute", country="IN",
            reputation_tier=1, reputation_source="curated",
        )

    def setUp(self):
        self.user = User.objects.create_user(username="nikhil", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def _apply(self, rows):
        apply_payload(self.profile, {"educations": rows})

    def test_rows_round_trip_in_order(self):
        self._apply([
            {"level": "bachelors", "institutionSlug": "elite_in"},
            {"level": "masters", "institutionSlug": "other", "institutionName": "Somewhere"},
        ])
        levels = [e.level for e in self.profile.educations.all()]
        self.assertEqual(levels, ["bachelors", "masters"])

    def test_omitted_rows_are_deleted(self):
        """Same contract as photos: the list is the complete desired state."""
        self._apply([{"level": "bachelors"}, {"level": "masters"}])
        self._apply([{"level": "bachelors"}])
        self.assertEqual(self.profile.educations.count(), 1)

    def test_client_cannot_rename_a_catalog_institution(self):
        """A payload pairing a real slug with a false name must not be believed."""
        self._apply([{"level": "bachelors", "institutionSlug": "elite_in",
                      "institutionName": "Harvard"}])
        entry = self.profile.educations.first()
        self.assertEqual(entry.institution_name, "Elite Institute")
        self.assertEqual(entry.institution_id, self.elite.pk)

    def test_unknown_slug_becomes_other_rather_than_inheriting_reputation(self):
        self._apply([{"level": "bachelors", "institutionSlug": "does_not_exist",
                      "institutionName": "Mystery College"}])
        entry = self.profile.educations.first()
        self.assertIsNone(entry.institution_id)
        self.assertTrue(entry.is_other)

    def test_school_rows_never_carry_a_reputation_claim(self):
        """Enforced server-side, not just hidden in the UI."""
        self._apply([{"level": "high_school", "institutionSlug": "other",
                      "institutionName": "St Marys", "reputationClaimed": True}])
        self.assertFalse(self.profile.educations.first().reputation_claimed)

    def test_school_rows_are_excluded_from_reputation(self):
        self._apply([{"level": "high_school", "institutionSlug": "elite_in"}])
        self.profile.refresh_derived_education()
        self.assertEqual(self.profile.education_reputation_tier, NO_REPUTATION)

    def test_derived_level_is_the_highest_not_the_last(self):
        self._apply([
            {"level": "phd", "institutionSlug": "elite_in", "fieldOfStudy": "physics"},
            {"level": "bachelors", "institutionSlug": "other", "institutionName": "X"},
        ])
        self.profile.refresh_derived_education()
        self.assertEqual(self.profile.education_level, "phd")
        self.assertEqual(self.profile.field_of_study, "physics")

    def test_professional_ties_with_masters_not_below_it(self):
        self.assertEqual(rank_of("professional"), rank_of("masters"))

    def test_best_reputation_wins_across_rows(self):
        self._apply([
            {"level": "bachelors", "institutionSlug": "other", "institutionName": "Tiny",
             "reputationClaimed": False},
            {"level": "masters", "institutionSlug": "elite_in"},
        ])
        self.profile.refresh_derived_education()
        self.assertEqual(self.profile.education_reputation_tier, 1)

    def test_self_claim_ranks_below_every_seeded_tier(self):
        """An unverified claim must never outrank a real institution."""
        self._apply([{"level": "masters", "institutionSlug": "other",
                      "institutionName": "Tiny", "reputationClaimed": True}])
        self.profile.refresh_derived_education()
        self.assertGreater(self.profile.education_reputation_tier, 4)
        self.assertLess(self.profile.education_reputation_tier, NO_REPUTATION)

    def test_unclaimed_other_ranks_below_a_claim(self):
        self._apply([{"level": "masters", "institutionSlug": "other",
                      "institutionName": "Tiny", "reputationClaimed": False}])
        self.profile.refresh_derived_education()
        claimed_tier = 5
        self.assertGreater(self.profile.education_reputation_tier, claimed_tier)

    def test_row_count_is_capped(self):
        self._apply([{"level": "bachelors"} for _ in range(20)])
        self.assertEqual(self.profile.educations.count(), ProfileEducation.MAX_PER_PROFILE)

    def test_rows_without_a_level_are_dropped(self):
        self._apply([{"level": "", "institutionName": "Nowhere"}, {"level": "masters"}])
        self.assertEqual(self.profile.educations.count(), 1)

    def test_no_rows_leaves_derived_columns_alone(self):
        """Profiles predating the education table must not lose their level."""
        self.profile.education_level = "bachelors"
        self.profile.refresh_derived_education()
        self.assertEqual(self.profile.education_level, "bachelors")

    def test_reputation_is_never_serialised(self):
        self._apply([{"level": "masters", "institutionSlug": "elite_in"}])
        self.profile.refresh_derived_education()
        data = profile_to_api(self.profile, None, public=True)
        self.assertNotIn("reputation", json.dumps(data))
        self.assertEqual(data["educations"][0]["institutionName"], "Elite Institute")

    def test_achievements_are_normalised_and_capped(self):
        apply_payload(self.profile, {"achievements": [
            {"title": " Gold medal ", "year": "2018", "detail": "x"},
            {"title": "", "year": "1"},          # dropped: no title
            *[{"title": f"a{i}"} for i in range(20)],
        ]})
        self.assertEqual(len(self.profile.achievements), 10)
        self.assertEqual(self.profile.achievements[0]["title"], "Gold medal")
        self.assertEqual(self.profile.achievements[0]["year"], 2018)

    def test_achievements_reject_wrong_shape(self):
        with self.assertRaises(ValueError):
            apply_payload(self.profile, {"achievements": [123]})


class InterestsTests(TestCase):
    """Interests count towards the headline percentage but never eligibility."""

    def setUp(self):
        self.user = User.objects.create_user(username="priya", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def test_interests_round_trip(self):
        # Hobbies rather than music: music, films and reading hold named picks
        # now, and their shape is covered by MediaPickTests. The three
        # categories below are still slug lists.
        apply_payload(self.profile, {"interestsHobbies": ["yoga", "cricket"]})
        self.assertEqual(self.profile.interests_hobbies, ["yoga", "cricket"])

    def test_each_category_is_independent(self):
        """One column per category, so saving one must not clear the others.

        This is the whole reason these are flat columns rather than a nested
        blob: apply_payload is key-to-column, and a partial payload of a nested
        object would wipe every category it did not mention.
        """
        apply_payload(self.profile, {
            "interestsHobbies": ["yoga"],
            "interestsTravel": ["mountains"],
        })
        apply_payload(self.profile, {"interestsHobbies": ["cricket"]})
        self.assertEqual(self.profile.interests_hobbies, ["cricket"])
        self.assertEqual(self.profile.interests_travel, ["mountains"])

    def test_interests_raise_the_headline_percentage(self):
        before = self.profile.compute_completeness()
        apply_payload(self.profile, {
            "interestsHobbies": ["yoga"],
            "interestsCuisines": ["bengali"],
            "interestsTravel": ["mountains"],
        })
        self.assertGreater(self.profile.compute_completeness(), before)

    def test_interests_never_affect_eligibility(self):
        """The guarantee that lets the wizard keep growing."""
        for field, value in FULLY_ANSWERED.items():
            setattr(self.profile, field, value)
        from django.utils import timezone
        self.profile.dob_time = timezone.now()
        self.profile.display_picture = "profile_pics/x.jpg"

        self.assertTrue(self.profile.is_complete)
        core_before = self.profile.core_completeness()

        # A profile with no interests at all is still eligible...
        self.assertEqual(self.profile.interests_music, [])
        self.assertTrue(self.profile.is_complete)
        # ...and the headline number is below 100 because interests are unanswered.
        self.assertLess(self.profile.compute_completeness(), 100)
        self.assertEqual(self.profile.core_completeness(), core_before)

    def test_free_text_is_not_scored(self):
        """Scoring it would push people to write filler to move a number."""
        before = self.profile.compute_completeness()
        apply_payload(self.profile, {"interestsOther": "I hike most weekends"})
        self.assertEqual(self.profile.compute_completeness(), before)
        self.assertEqual(self.profile.interests_other, "I hike most weekends")

    def test_daily_routine_column_is_finally_wired(self):
        """The column shipped in 0001 and had no read or write path until now."""
        apply_payload(self.profile, {"dailyRoutine": "early_riser"})
        self.assertEqual(self.profile.daily_routine, "early_riser")
        data = profile_to_api(self.profile, None, public=True)
        self.assertEqual(data["dailyRoutine"], "early_riser")

    def test_interests_are_capped_like_other_lists(self):
        apply_payload(self.profile, {"interestsHobbies": [f"h{i}" for i in range(40)]})
        self.assertEqual(len(self.profile.interests_hobbies), MAX_LIST_ITEMS)


class BadgeVersusEligibilityTests(TestCase):
    """The two thresholds pull apart once the wizard asks for more.

    This is the crux of the whole completeness design, so it gets its own test:
    filling the core set keeps you in match results, but the "Complete" badge
    now wants everything - and neither number may drag the other with it.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="dev", password="x")
        self.profile = Profile.objects.get(user=self.user)
        for field, value in FULLY_ANSWERED.items():
            setattr(self.profile, field, value)
        from django.utils import timezone
        self.profile.dob_time = timezone.now()
        self.profile.display_picture = "profile_pics/x.jpg"
        self.profile.phone_verified = True

    def test_core_only_is_eligible_but_not_badged(self):
        self.profile.save()
        self.assertTrue(self.profile.is_complete, "must still appear in matches")
        self.assertEqual(self.profile.core_completeness(), 100)
        self.assertLess(self.profile.compute_completeness(), 100)
        self.assertEqual(self.profile.verification_level, VerificationLevel.BASIC)

    def test_filling_the_extras_earns_the_badge(self):
        for field, value in EXTRA_ANSWERED.items():
            setattr(self.profile, field, value)
        self.profile.save()
        self.assertEqual(self.profile.compute_completeness(), 100)
        self.assertEqual(self.profile.verification_level, VerificationLevel.COMPLETE)

    def test_clearing_an_extra_loses_the_badge_but_not_eligibility(self):
        for field, value in EXTRA_ANSWERED.items():
            setattr(self.profile, field, value)
        self.profile.save()
        self.assertEqual(self.profile.verification_level, VerificationLevel.COMPLETE)

        self.profile.interests_music = []
        self.profile.save()
        self.assertLess(self.profile.verification_level, VerificationLevel.COMPLETE)
        self.assertTrue(self.profile.is_complete, "eligibility must not follow the badge")


class EmployerTests(TestCase):
    """Employer resolution, and the rules that keep it honest."""

    @classmethod
    def setUpTestData(cls):
        cls.employer = Employer.objects.create(
            slug="techy_in", name="Techy Corp", country="IN",
            email_domains=["techy.com"], profession_tags=["software_engineer"],
            reputation_tier=1, reputation_source="curated",
        )

    def setUp(self):
        self.user = User.objects.create_user(username="rohit", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def test_catalog_pick_links_and_scores(self):
        apply_payload(self.profile, {"employerSlug": "techy_in", "employerName": "Techy Corp"})
        self.assertEqual(self.profile.employer_id, self.employer.pk)
        self.assertEqual(self.profile.employer_name, "Techy Corp")
        self.assertFalse(self.profile.employer_is_other)
        self.assertEqual(self.profile.employer_reputation_tier, 1)

    def test_client_cannot_rename_a_catalog_employer(self):
        """Same rule as institutions: the catalog owns the name, not the client."""
        apply_payload(self.profile, {
            "employerSlug": "techy_in",
            "employerName": "Prime Minister of India",
        })
        self.assertEqual(self.profile.employer_name, "Techy Corp")

    def test_other_employer_is_free_text_with_no_reputation(self):
        """An employer we have not heard of is unknown, not bad."""
        apply_payload(self.profile, {"employerSlug": "other", "employerName": "Small Studio"})
        self.assertIsNone(self.profile.employer_id)
        self.assertEqual(self.profile.employer_name, "Small Studio")
        self.assertTrue(self.profile.employer_is_other)
        self.assertEqual(self.profile.employer_reputation_tier, NO_REPUTATION)

    def test_unknown_slug_falls_back_to_free_text(self):
        apply_payload(self.profile, {"employerSlug": "nope", "employerName": "Mystery Ltd"})
        self.assertIsNone(self.profile.employer_id)
        self.assertEqual(self.profile.employer_name, "Mystery Ltd")

    def test_employer_reputation_is_never_serialised(self):
        apply_payload(self.profile, {"employerSlug": "techy_in"})
        data = profile_to_api(self.profile, None, public=True)
        self.assertNotIn("employer_reputation", json.dumps(data))
        self.assertNotIn("reputation_tier", json.dumps(data))
        self.assertEqual(data["employerName"], "Techy Corp")
        self.assertEqual(data["employerSlug"], "techy_in")

    def test_email_domains_never_reach_the_client(self):
        """They are the hook for a future work-email check, not public data."""
        apply_payload(self.profile, {"employerSlug": "techy_in"})
        data = profile_to_api(self.profile, None, public=True)
        self.assertNotIn("techy.com", json.dumps(data))

    def test_work_country_and_visa_round_trip(self):
        apply_payload(self.profile, {"workCountry": "US", "visaStatus": "h1b"})
        self.assertEqual(self.profile.work_country, "US")
        self.assertEqual(self.profile.visa_status, "h1b")

    def test_employer_fields_do_not_affect_eligibility(self):
        """Conditional on being employed, so they must never gate anything.

        Scoring them would make 100% unreachable for students, homemakers and
        anyone between jobs.
        """
        for field, value in FULLY_ANSWERED.items():
            setattr(self.profile, field, value)
        from django.utils import timezone
        self.profile.dob_time = timezone.now()
        self.profile.display_picture = "profile_pics/x.jpg"

        before = self.profile.compute_completeness()
        self.assertTrue(self.profile.is_complete)

        apply_payload(self.profile, {"employerSlug": "techy_in", "workCountry": "IN"})
        self.assertEqual(self.profile.compute_completeness(), before)
        self.assertTrue(self.profile.is_complete)


class ManagedByTests(TestCase):
    """Who runs the profile - and the rule that it must never touch identity."""

    def setUp(self):
        self.user = User.objects.create_user(username="kavya", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def test_defaults_follow_profile_for(self):
        self.assertEqual(managed_by_rules.default_for("son"), "parent")
        self.assertEqual(managed_by_rules.default_for("sister"), "sibling")
        self.assertEqual(managed_by_rules.default_for("self"), "self")
        self.assertEqual(managed_by_rules.default_for(""), "")

    def test_stored_value_wins_over_the_default(self):
        """The whole reason the column exists: cases profile_for cannot express."""
        self.assertEqual(managed_by_rules.resolve("guardian", "son"), "guardian")

    def test_blank_falls_back_so_old_profiles_still_read(self):
        self.assertEqual(managed_by_rules.resolve("", "daughter"), "parent")

    def test_labels_differ_for_owner_and_visitor(self):
        self.assertEqual(managed_by_rules.label_for("self", "self"), "Managed by the member")
        self.assertEqual(
            managed_by_rules.label_for("self", "self", owner=True), "You manage this profile"
        )

    def test_unknown_stays_blank_rather_than_guessing(self):
        self.assertEqual(managed_by_rules.label_for("", ""), "")

    def test_payload_exposes_derived_value_not_raw_profile_for(self):
        """"son" would leak the member's gender a second time."""
        self.profile.profile_for = "son"
        self.profile.managed_by = "parent"
        self.profile.save()

        public = profile_to_api(self.profile, None, public=True)
        self.assertEqual(public["managedBy"], "parent")
        self.assertEqual(public["managedByLabel"], "Managed by their parent")
        self.assertNotIn("profileFor", public)

        owner = profile_to_api(self.profile, None, public=False)
        self.assertIn("profileFor", owner)

    def test_managed_by_never_changes_gender_or_profile_id(self):
        """The load-bearing rule.

        profile_for feeds derive_gender, which feeds build_profile_id - a
        permanent public URL. managed_by must stay entirely cosmetic, or editing
        it would silently orphan somebody's profile link.
        """
        self.profile.profile_for = "son"
        self.profile.gender = "M"
        self.profile.age = 30
        self.profile.save()

        gender_before = self.profile.gender
        id_before = self.profile.profile_id

        apply_payload(self.profile, {"managedBy": "friend"})
        self.profile.save()

        self.assertEqual(self.profile.managed_by, "friend")
        self.assertEqual(self.profile.gender, gender_before)
        self.assertEqual(self.profile.profile_id, id_before)


class MobilityPreferenceTests(TestCase):
    """Relocation and settling-abroad preferences accept several answers."""

    def setUp(self):
        self.user = User.objects.create_user(username="anita", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def test_several_answers_are_kept(self):
        """Someone happy with "yes" is usually happy with "open" too."""
        apply_payload(self.profile, {"partnerSettleAbroad": ["yes", "open"]})
        self.assertEqual(self.profile.partner_settle_abroad, ["yes", "open"])

    def test_all_clears_to_no_preference(self):
        """"All" means every answer is acceptable, which is an empty list."""
        apply_payload(self.profile, {"partnerRelocateAfterMarriage": ["any"]})
        self.assertEqual(self.profile.partner_relocate_after_marriage, [])

    def test_all_alongside_others_is_dropped(self):
        apply_payload(self.profile, {"partnerSettleAbroad": ["any", "yes"]})
        self.assertEqual(self.profile.partner_settle_abroad, ["yes"])

    def test_empty_clears(self):
        apply_payload(self.profile, {"partnerSettleAbroad": ["yes"]})
        apply_payload(self.profile, {"partnerSettleAbroad": []})
        self.assertEqual(self.profile.partner_settle_abroad, [])

    def test_payload_returns_lists_not_strings(self):
        apply_payload(self.profile, {"partnerSettleAbroad": ["open"]})
        data = profile_to_api(self.profile, None, public=True)
        self.assertEqual(data["partnerSettleAbroad"], ["open"])
        self.assertEqual(data["partnerRelocateAfterMarriage"], [])

    def test_own_answer_stays_a_single_value(self):
        """`settleAbroad` is about you, so one answer is the right shape."""
        apply_payload(self.profile, {"settleAbroad": "open"})
        self.assertEqual(self.profile.settle_abroad, "open")


class IdentityLockTests(TestCase):
    """Name, birth date, gender and height stop moving after a day.

    Gender and age are baked into `profile_id` the moment both are known, and
    that id is never reissued - so these are the facts a family checks a profile
    against, and one that can be swapped freely is one that can be repurposed
    after it has been seen.

    Each group has its own allowance; see `identity.IDENTITY_LIMITS` for why
    they differ.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="asha-id", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def _answer(self):
        """Fill the guarded fields in for the first time, which is always free."""
        apply_payload(self.profile, {
            "firstName": "Asha",
            "surname": "Menon",
            "dob": "1996-04-12T09:30",
            "gender": "female",
            "heightFeet": 5,
            "heightInches": 4,
        })

    def test_first_answer_is_free(self):
        self._answer()
        for group in identity.IDENTITY_GROUPS:
            self.assertEqual(self.profile.identity_edits[group]["count"], 0, group)

        locks = identity.lock_state(self.profile)
        self.assertFalse(locks["name"]["locked"])
        self.assertEqual(locks["name"]["changesLeft"], 2)
        self.assertEqual(locks["gender"]["changesLeft"], 1)
        self.assertEqual(locks["height"]["changesLeft"], 3)

    def test_resending_an_unchanged_value_costs_nothing(self):
        """The wizard PATCHes whole steps; re-saving must not burn a change."""
        self._answer()
        self._answer()
        self._answer()
        for group in identity.IDENTITY_GROUPS:
            self.assertEqual(self.profile.identity_edits[group]["count"], 0, group)

    def test_both_names_in_one_save_is_one_change(self):
        """Correcting a first name and a surname together is one act."""
        self._answer()
        apply_payload(self.profile, {"firstName": "Aasha", "surname": "Nair"})
        self.assertEqual(self.profile.identity_edits["name"]["count"], 1)

    # ---- Each group's own limit ----

    def test_name_allows_two_changes(self):
        self._answer()
        apply_payload(self.profile, {"firstName": "Aasha"})
        apply_payload(self.profile, {"firstName": "Ashaa"})
        with self.assertRaises(identity.IdentityLocked):
            apply_payload(self.profile, {"firstName": "Asha"})

    def test_gender_allows_only_one_change(self):
        """Half of `profile_id`, and a profile that changes gender is a
        different profile."""
        self._answer()
        apply_payload(self.profile, {"gender": "male"})
        self.assertTrue(identity.lock_state(self.profile)["gender"]["locked"])

        with self.assertRaises(identity.IdentityLocked) as caught:
            apply_payload(self.profile, {"gender": "female"})
        self.assertIn("once", str(caught.exception))

    def test_height_allows_three_changes(self):
        self._answer()
        for inches in (5, 6, 7):
            apply_payload(self.profile, {"heightFeet": 5, "heightInches": inches})
        self.assertEqual(self.profile.identity_edits["height"]["count"], 3)

        with self.assertRaises(identity.IdentityLocked):
            apply_payload(self.profile, {"heightFeet": 5, "heightInches": 8})

    def test_time_of_birth_allows_three_changes(self):
        self._answer()
        for clock in ("10:30", "11:30", "12:30"):
            apply_payload(self.profile, {"dob": f"1996-04-12T{clock}"})
        self.assertEqual(self.profile.identity_edits["dob_time"]["count"], 3)

        with self.assertRaises(identity.IdentityLocked):
            apply_payload(self.profile, {"dob": "1996-04-12T13:30"})

    def test_date_of_birth_allows_two_changes(self):
        self._answer()
        apply_payload(self.profile, {"dob": "1996-04-13T09:30"})
        apply_payload(self.profile, {"dob": "1996-04-14T09:30"})

        with self.assertRaises(identity.IdentityLocked) as caught:
            apply_payload(self.profile, {"dob": "1996-04-15T09:30"})
        self.assertIn("date of birth", str(caught.exception))

    # ---- The two halves of one column are two allowances ----

    def test_changing_the_date_does_not_spend_the_time(self):
        self._answer()
        apply_payload(self.profile, {"dob": "1996-05-12T09:30"})
        self.assertEqual(self.profile.identity_edits["dob_date"]["count"], 1)
        self.assertEqual(self.profile.identity_edits["dob_time"]["count"], 0)

    def test_changing_the_time_does_not_spend_the_date(self):
        self._answer()
        apply_payload(self.profile, {"dob": "1996-04-12T21:45"})
        self.assertEqual(self.profile.identity_edits["dob_time"]["count"], 1)
        self.assertEqual(self.profile.identity_edits["dob_date"]["count"], 0)

    def test_a_date_locked_out_still_leaves_the_time_editable(self):
        self._answer()
        apply_payload(self.profile, {"dob": "1996-04-13T09:30"})
        apply_payload(self.profile, {"dob": "1996-04-14T09:30"})
        self.assertTrue(identity.lock_state(self.profile)["dob_date"]["locked"])

        apply_payload(self.profile, {"dob": "1996-04-14T18:00"})
        self.assertEqual(self.profile.dob_time.hour, 18)

    # ---- Refusal behaviour ----

    def test_a_refused_change_is_not_applied(self):
        """The instance must not be left holding a change that was rejected."""
        self._answer()
        apply_payload(self.profile, {"gender": "male"})

        with self.assertRaises(identity.IdentityLocked):
            apply_payload(self.profile, {"gender": "female"})

        self.assertEqual(self.profile.gender, "M")

    def test_a_refusal_rolls_back_the_allowed_changes_in_the_same_payload(self):
        """One save, one outcome. A half-applied step is worse than a refusal."""
        self._answer()
        apply_payload(self.profile, {"gender": "male"})

        with self.assertRaises(identity.IdentityLocked):
            apply_payload(self.profile, {"gender": "female", "firstName": "Meera"})

        self.assertEqual(self.profile.first_name, "Asha")

    # ---- The window ----

    def test_window_closes_after_24_hours(self):
        """Permanent once the day is up, even with a change still unused."""
        self._answer()
        apply_payload(self.profile, {"heightInches": 5})

        opened = timezone.now() - timedelta(hours=25)
        self.profile.identity_edits = {
            **self.profile.identity_edits,
            "height": {"answered": True, "count": 1, "opened_at": opened.isoformat()},
        }

        with self.assertRaises(identity.IdentityLocked):
            apply_payload(self.profile, {"heightInches": 6})

        self.assertTrue(identity.lock_state(self.profile)["height"]["locked"])

    def test_a_later_change_does_not_extend_the_window(self):
        self._answer()
        apply_payload(self.profile, {"heightInches": 5})
        opened = self.profile.identity_edits["height"]["opened_at"]

        apply_payload(self.profile, {"heightInches": 6})
        self.assertEqual(self.profile.identity_edits["height"]["opened_at"], opened)

    # ---- Unanswered fields, and defaults that are not answers ----

    def test_a_default_is_not_an_answer(self):
        """`gender` defaults to "M", which nobody chose.

        Without this, a woman picking "female" for the first time spent her one
        and only change on saying what she was.
        """
        apply_payload(self.profile, {"gender": "female"})
        self.assertEqual(self.profile.identity_edits["gender"]["count"], 0)
        self.assertFalse(identity.lock_state(self.profile)["gender"]["locked"])

    def test_an_unanswered_field_is_never_locked(self):
        """Somebody who registers today and fills the wizard next week."""
        self.profile.identity_edits = {}
        self.assertFalse(identity.lock_state(self.profile)["name"]["locked"])
        apply_payload(self.profile, {"firstName": "Asha"})
        self.assertEqual(self.profile.first_name, "Asha")

    # ---- Exposure ----

    def test_lock_state_reaches_the_owner_and_not_the_public(self):
        owner = profile_to_api(self.profile, None, public=False)
        self.assertIn("identityLocks", owner)
        self.assertEqual(owner["identityLocks"]["gender"]["limit"], 1)

        public = profile_to_api(self.profile, None, public=True)
        self.assertNotIn("identityLocks", public)

    def test_save_step_returns_the_fresh_allowance(self):
        """So the wizard can go inert without a reload."""
        request = SimpleNamespace(user=self.user)
        result = update_profile_step(
            request,
            SimpleNamespace(dict=lambda **_: {"step": 0, "gender": "female"}),
        )
        self.assertIn("identity_locks", result)
        self.assertEqual(result["identity_locks"]["gender"]["changesLeft"], 1)



class DerivedGenderTests(TestCase):
    """Gender is decided once, at registration, from what was already asked.

    Somebody registering for themselves has said whether they seek a bride or a
    groom, which settles their own gender; a parent has said the profile is for a
    son or a daughter. Asking again would invite the two answers to disagree -
    and gender is the one field that cannot be corrected twice, because
    `build_profile_id` bakes it into a permanent public id.
    """

    def test_looking_for_a_groom_makes_the_member_female(self):
        self.assertEqual(derive_gender("self", "groom"), "F")

    def test_looking_for_a_bride_makes_the_member_male(self):
        self.assertEqual(derive_gender("self", "bride"), "M")

    def test_profile_for_decides_when_it_is_not_their_own(self):
        self.assertEqual(derive_gender("son", None), "M")
        self.assertEqual(derive_gender("brother", None), "M")
        self.assertEqual(derive_gender("daughter", None), "F")
        self.assertEqual(derive_gender("sister", None), "F")

    def test_looking_for_is_ignored_when_the_profile_is_for_someone_else(self):
        """A mother looking for a bride is registering a son, not herself."""
        self.assertEqual(derive_gender("son", "bride"), "M")
        self.assertEqual(derive_gender("daughter", "groom"), "F")

    def test_unanswerable_falls_back_to_other(self):
        """Unreachable through the API - registration rejects self with no
        `looking_for`, and `profile_for` is a Literal of five values - but the
        fallback must not guess a gender."""
        self.assertEqual(derive_gender("self", None), "O")
        self.assertEqual(derive_gender("cousin", None), "O")


class GenderLedgerTests(TestCase):
    """A derived gender counts as the answer, so one change remains."""

    def setUp(self):
        self.user = User.objects.create_user(username="deva", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def test_mark_answered_records_without_spending(self):
        identity.mark_answered(self.profile, "gender")
        self.assertEqual(
            self.profile.identity_edits["gender"],
            {"answered": True, "count": 0, "opened_at": ""},
        )
        self.assertFalse(identity.lock_state(self.profile)["gender"]["locked"])

    def test_mark_answered_never_resets_a_count(self):
        identity.mark_answered(self.profile, "gender")
        self.profile.identity_edits = {
            "gender": {"answered": True, "count": 1, "opened_at": "2026-01-01T00:00:00+00:00"}
        }
        identity.mark_answered(self.profile, "gender")
        self.assertEqual(self.profile.identity_edits["gender"]["count"], 1)

    def test_unknown_group_is_a_programming_error(self):
        with self.assertRaises(KeyError):
            identity.mark_answered(self.profile, "favourite_colour")

    def test_one_change_from_a_prefilled_gender_locks_it(self):
        """The whole point: a pre-filled value must not buy a free change.

        Without the stamp the wizard's first save reads as the free first answer
        and the member gets two changes where the rule allows one.
        """
        self.profile.gender = "F"
        identity.mark_answered(self.profile, "gender")

        apply_payload(self.profile, {"gender": "male"})
        self.assertEqual(self.profile.identity_edits["gender"]["count"], 1)
        self.assertTrue(identity.lock_state(self.profile)["gender"]["locked"])

        with self.assertRaises(identity.IdentityLocked):
            apply_payload(self.profile, {"gender": "female"})

    def test_without_the_stamp_the_first_change_is_still_free(self):
        """The contrast, so the stamp is demonstrably what does the work."""
        self.profile.gender = "F"
        apply_payload(self.profile, {"gender": "male"})
        self.assertEqual(self.profile.identity_edits["gender"]["count"], 0)
        self.assertFalse(identity.lock_state(self.profile)["gender"]["locked"])

    def test_registration_stamps_the_ledger(self):
        """The wiring, not just the helper.

        Goes through the real endpoint because the stamp has to happen in the
        same transaction as the derivation - a later save would mint
        `profile_id` from a gender the ledger knew nothing about.
        """
        from apps.auth_api.api import register
        from apps.auth_api.schema import RegisterSchema

        register(
            SimpleNamespace(),
            RegisterSchema(
                email="sunita@example.com",
                first_name="Sunita",
                surname="Rao",
                profile_for="self",
                age=27,
                looking_for="groom",
                country_code="+91",
                phone="9876500011",
                password="secret123",
            ),
        )

        profile = Profile.objects.get(email="sunita@example.com")
        self.assertEqual(profile.gender, "F")
        self.assertEqual(
            profile.identity_edits["gender"],
            {"answered": True, "count": 0, "opened_at": ""},
        )
        # One change, and then fixed.
        locks = identity.lock_state(profile)
        self.assertEqual(locks["gender"]["changesLeft"], 1)
        self.assertFalse(locks["gender"]["locked"])

        # Nothing else was stamped: those the member types themselves.
        for group in ("name", "dob_date", "dob_time", "height"):
            self.assertNotIn(group, profile.identity_edits, group)

    def test_resaving_the_prefilled_value_costs_nothing(self):
        """The wizard PATCHes all of step 0, including gender, on every
        Continue."""
        self.profile.gender = "F"
        identity.mark_answered(self.profile, "gender")

        apply_payload(self.profile, {"gender": "female"})
        apply_payload(self.profile, {"gender": "female"})
        self.assertEqual(self.profile.identity_edits["gender"]["count"], 0)
        self.assertFalse(identity.lock_state(self.profile)["gender"]["locked"])


class LocationStateTests(TestCase):
    """The state/province between country and city."""

    def setUp(self):
        self.user = User.objects.create_user(username="ravi-state", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def test_round_trip(self):
        apply_payload(self.profile, {
            "currentCountry": "IN",
            "currentState": "Kerala",
            "currentCity": "Kochi, Kerala, India",
            "placeOfBirthState": "Tamil Nadu",
            "familyLivingInState": "Kerala",
        })
        data = profile_to_api(self.profile, None, public=True)
        self.assertEqual(data["currentState"], "Kerala")
        self.assertEqual(data["placeOfBirthState"], "Tamil Nadu")
        self.assertEqual(data["familyLivingInState"], "Kerala")

    def test_states_do_not_move_eligibility(self):
        """Extras never touch the core set - the guarantee that lets it grow."""
        for field, value in FULLY_ANSWERED.items():
            setattr(self.profile, field, value)
        self.profile.dob_time = timezone.now()
        self.profile.display_picture = "profile_pics/x.jpg"
        core_before = self.profile.core_completeness()

        apply_payload(self.profile, {"currentState": "Kerala"})
        self.assertEqual(self.profile.core_completeness(), core_before)


class MediaPickTests(TestCase):
    """Named picks for Music, Films and Reading.

    These three columns stopped holding slug lists and started holding objects.
    The tests that matter most are the ones about links: `url`, `thumbnail` and
    `provider` all arrive from the client, and save-step will write whatever it
    is handed.
    """

    YOUTUBE = "https://www.youtube.com/watch?v=Umqb9KENgmk"
    THUMB = "https://i.ytimg.com/vi/Umqb9KENgmk/hqdefault.jpg"

    def setUp(self):
        self.user = User.objects.create_user(username="nikhil", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def _pick(self, **overrides):
        pick = {
            "title": "Tum Hi Ho",
            "subtitle": "Arijit Singh",
            "url": self.YOUTUBE,
            "provider": "youtube",
            "thumbnail": self.THUMB,
        }
        pick.update(overrides)
        return pick

    def test_round_trip(self):
        apply_payload(self.profile, {"interestsMusic": [self._pick()]})
        self.assertEqual(self.profile.interests_music, [self._pick()])

    def test_title_only_is_a_complete_pick(self):
        """Typing a name without pasting a link is a real answer."""
        apply_payload(self.profile, {"interestsMovies": [{"title": "Sholay"}]})
        self.assertEqual(
            self.profile.interests_movies,
            [{"title": "Sholay", "subtitle": "", "url": "", "provider": "", "thumbnail": ""}],
        )

    def test_bare_string_is_upgraded(self):
        apply_payload(self.profile, {"interestsBooks": ["Godaan"]})
        self.assertEqual(self.profile.interests_books[0]["title"], "Godaan")

    def test_blank_title_is_skipped(self):
        """The editor keeps a trailing blank row; it must not become a pick."""
        apply_payload(
            self.profile,
            {"interestsMusic": [self._pick(), {"title": "   "}, {"title": ""}]},
        )
        self.assertEqual(len(self.profile.interests_music), 1)

    def test_cap_counts_kept_rows_not_raw_ones(self):
        """Blanks must not consume a slot and push out a real pick."""
        payload = []
        for index in range(MAX_PICKS):
            payload.append({"title": ""})
            payload.append(self._pick(title=f"Song {index}"))

        apply_payload(self.profile, {"interestsMusic": payload})
        self.assertEqual(len(self.profile.interests_music), MAX_PICKS)
        self.assertEqual(self.profile.interests_music[0]["title"], "Song 0")

    def test_wrong_shape_is_rejected_not_coerced(self):
        with self.assertRaises(ValueError):
            apply_payload(self.profile, {"interestsMusic": {"title": "x"}})
        with self.assertRaises(ValueError):
            apply_payload(self.profile, {"interestsMusic": [["x"]]})

    def test_title_and_subtitle_are_capped(self):
        apply_payload(
            self.profile,
            {"interestsMusic": [self._pick(title="x" * 500, subtitle="y" * 500)]},
        )
        pick = self.profile.interests_music[0]
        self.assertEqual(len(pick["title"]), MAX_PICK_TITLE)
        self.assertEqual(len(pick["subtitle"]), MAX_PICK_SUBTITLE)

    # ---- The link boundary ----

    def test_unknown_link_host_is_dropped_and_the_title_survives(self):
        apply_payload(
            self.profile,
            {"interestsMusic": [self._pick(url="https://example.com/x", provider="youtube")]},
        )
        pick = self.profile.interests_music[0]
        self.assertEqual(pick["title"], "Tum Hi Ho")
        self.assertEqual(pick["url"], "")
        self.assertEqual(pick["provider"], "")

    def test_host_match_is_exact_not_a_suffix(self):
        """`evil-youtube.com` and `youtube.com.attacker.net` are not YouTube."""
        for url in (
            "https://evil-youtube.com/watch?v=1",
            "https://youtube.com.attacker.net/watch?v=1",
        ):
            apply_payload(self.profile, {"interestsMusic": [self._pick(url=url)]})
            self.assertEqual(self.profile.interests_music[0]["url"], "", url)

    def test_link_must_belong_to_the_provider_it_claims(self):
        apply_payload(
            self.profile,
            {"interestsMusic": [self._pick(url=self.YOUTUBE, provider="spotify")]},
        )
        self.assertEqual(self.profile.interests_music[0]["url"], "")

    def test_http_link_is_dropped(self):
        apply_payload(
            self.profile,
            {"interestsMusic": [self._pick(url="http://www.youtube.com/watch?v=1")]},
        )
        self.assertEqual(self.profile.interests_music[0]["url"], "")

    def test_unknown_thumbnail_host_is_dropped(self):
        """The one that matters: any URL here is fetched by every viewer."""
        apply_payload(
            self.profile,
            {"interestsMusic": [self._pick(thumbnail="https://tracker.example/pixel.gif")]},
        )
        pick = self.profile.interests_music[0]
        self.assertEqual(pick["thumbnail"], "")
        self.assertEqual(pick["title"], "Tum Hi Ho")

    def test_unknown_provider_slug_is_dropped(self):
        apply_payload(
            self.profile,
            {"interestsMusic": [self._pick(provider="myspace")]},
        )
        pick = self.profile.interests_music[0]
        self.assertEqual(pick["provider"], "")
        # The link went with it: it can no longer be attributed to a provider.
        self.assertEqual(pick["url"], "")

    # ---- The columns that did NOT change ----

    def test_tag_categories_still_hold_slugs(self):
        apply_payload(self.profile, {"interestsHobbies": ["yoga", "cricket"]})
        self.assertEqual(self.profile.interests_hobbies, ["yoga", "cricket"])

    def test_picks_round_trip_through_the_api_payload(self):
        apply_payload(self.profile, {"interestsMusic": [self._pick()]})
        data = profile_to_api(self.profile, None, public=True)
        self.assertEqual(data["interestsMusic"][0]["thumbnail"], self.THUMB)

    def test_completeness_still_counts_a_filled_category(self):
        """The slot is truthiness of the list, so the new shape reads the same."""
        before = self.profile.compute_completeness()
        apply_payload(self.profile, {"interestsMusic": [self._pick()]})
        self.assertGreater(self.profile.compute_completeness(), before)


class LifestylePreferenceTests(TestCase):
    """The three preferences that replaced the After-marriage questions.

    They matter more than the two they replaced for one reason: each is matched
    against an answer the other person actually gives. Nothing on a profile ever
    said whether they would relocate, so that preference could never be scored.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="meera", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def test_round_trip(self):
        apply_payload(
            self.profile,
            {
                "partnerReligiosities": ["religious", "spiritual"],
                "partnerSmoking": ["non_smoker"],
                "partnerDrinking": ["non_drinker", "socially"],
            },
        )
        self.assertEqual(
            self.profile.partner_religiosities,
            ["religious", "spiritual"],
        )
        self.assertEqual(self.profile.partner_smoking, ["non_smoker"])
        self.assertEqual(self.profile.partner_drinking, ["non_drinker", "socially"])

    def test_defaults_are_empty_lists(self):
        """Empty is "no preference" - the same reading as every other list."""
        data = profile_to_api(self.profile, None, public=True)
        self.assertEqual(data["partnerReligiosities"], [])
        self.assertEqual(data["partnerSmoking"], [])
        self.assertEqual(data["partnerDrinking"], [])

    def test_normalising_applies(self):
        """They go through the same list boundary as the older columns."""
        apply_payload(self.profile, {"partnerSmoking": ["non_smoker", "non_smoker", "", None]})
        self.assertEqual(self.profile.partner_smoking, ["non_smoker"])

    def test_dropped_columns_still_round_trip(self):
        """The wizard stopped asking; profiles that answered keep their answer.

        The columns are dormant, not removed - dropping them would blank an
        answer that is still rendered on those profiles.
        """
        apply_payload(self.profile, {"partnerSettleAbroad": ["yes"]})
        data = profile_to_api(self.profile, None, public=True)
        self.assertEqual(data["partnerSettleAbroad"], ["yes"])


class RegisteredAtTests(TestCase):
    """The stamp that says the wizard has been finished once.

    It exists because nothing else could say it. `is_complete` is a property
    recomputed from live field values, so it flips back the moment a core field
    is cleared - a member who blanked one answer would be handed the first-run
    wizard all over again.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="kiran", password="x")
        self.profile = Profile.objects.get(user=self.user)
        self.request = SimpleNamespace(user=self.user)

    def _save(self, step, **fields):
        return update_profile_step(
            self.request,
            SimpleNamespace(dict=lambda **_: {"step": step, **fields}),
        )

    def test_unset_until_the_last_step(self):
        self.assertIsNone(self.profile.registered_at)
        self._save(0, firstName="Kiran")
        self.profile.refresh_from_db()
        self.assertIsNone(self.profile.registered_at)

    def test_stamped_on_the_last_step(self):
        result = self._save(LAST_WIZARD_STEP)
        self.profile.refresh_from_db()
        self.assertIsNotNone(self.profile.registered_at)
        self.assertEqual(result["registered_at"], self.profile.registered_at.isoformat())

    def test_never_moves_once_set(self):
        """A later edit of the photo step must not restart the first run."""
        self._save(LAST_WIZARD_STEP)
        self.profile.refresh_from_db()
        first = self.profile.registered_at

        self._save(LAST_WIZARD_STEP)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.registered_at, first)

    def test_survives_a_field_being_cleared(self):
        """The case `is_complete` could not cover."""
        self.profile.first_name = "Kiran"
        self.profile.save()
        self._save(LAST_WIZARD_STEP)
        self.profile.refresh_from_db()
        self.assertIsNotNone(self.profile.registered_at)

        self.profile.first_name = ""
        self.profile.save()
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.is_complete)
        self.assertIsNotNone(self.profile.registered_at)

    def test_owner_payload_carries_it_and_public_does_not(self):
        """It drives the owner's wizard and says nothing a match needs."""
        self._save(LAST_WIZARD_STEP)
        self.profile.refresh_from_db()

        owner = profile_to_api(self.profile, None, public=False)
        self.assertIsNotNone(owner["registeredAt"])

        public = profile_to_api(self.profile, None, public=True)
        self.assertNotIn("registeredAt", public)


class PresenceTests(TestCase):
    """`last_active_at`, and the two ways stamping it could go quietly wrong."""

    def setUp(self):
        self.user = User.objects.create_user(username="presence-asha", password="x")
        self.profile = Profile.objects.get(user=self.user)

    def test_first_call_stamps(self):
        presence.touch(self.user)
        self.profile.refresh_from_db()
        self.assertIsNotNone(self.profile.last_active_at)

    def test_second_call_inside_the_interval_does_not_write(self):
        presence.touch(self.user)
        self.profile.refresh_from_db()
        first = self.profile.last_active_at

        presence.touch(self.user)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.last_active_at, first)

    def test_call_after_the_interval_rewrites(self):
        stale = timezone.now() - presence.STAMP_INTERVAL - timedelta(seconds=30)
        Profile.objects.filter(pk=self.profile.pk).update(last_active_at=stale)

        presence.touch(self.user)
        self.profile.refresh_from_db()
        self.assertGreater(self.profile.last_active_at, stale)

    def test_stamping_leaves_updated_at_alone(self):
        """`updated_at` is on the /me payload. Bumping it on every request would
        make the profile look edited every time the member loaded a page."""
        before = Profile.objects.get(pk=self.profile.pk).updated_at

        Profile.objects.filter(pk=self.profile.pk).update(last_active_at=None)
        presence.touch(self.user)

        self.assertEqual(Profile.objects.get(pk=self.profile.pk).updated_at, before)

    def test_stamping_does_not_recompute_completeness(self):
        """Proves .update() and not .save(). A deliberately wrong completeness
        must survive a touch - if save() ran, it would be corrected."""
        Profile.objects.filter(pk=self.profile.pk).update(profile_completeness=77)

        presence.touch(self.user)

        self.assertEqual(Profile.objects.get(pk=self.profile.pk).profile_completeness, 77)

    def test_touch_tolerates_no_user(self):
        presence.touch(None)  # must not raise

    def test_online_within_the_window(self):
        self.assertTrue(presence.is_online(timezone.now() - timedelta(minutes=1)))
        self.assertFalse(presence.is_online(timezone.now() - timedelta(hours=2)))
        self.assertFalse(presence.is_online(None))

    def test_never_stamped_is_none_not_offline(self):
        """Every profile predating the column is NULL. Calling those members
        offline would be a claim we cannot support."""
        self.assertIsNone(presence.to_api(None, exact=True))

    def test_other_viewers_see_the_hour_not_the_minute(self):
        stamp = timezone.now().replace(hour=9, minute=37, second=12) - timedelta(days=1)

        exact = presence.to_api(stamp, exact=True)
        floored = presence.to_api(stamp, exact=False)

        self.assertEqual(exact["lastActiveAt"], stamp.isoformat())
        self.assertTrue(floored["lastActiveAt"].startswith(stamp.strftime("%Y-%m-%dT%H:00")))

    def test_online_hides_the_timestamp_from_others(self):
        """"Online now" is the whole message; the exact minute only adds exposure."""
        now = timezone.now()
        self.assertIsNone(presence.to_api(now, exact=False)["lastActiveAt"])
        self.assertIsNotNone(presence.to_api(now, exact=True)["lastActiveAt"])

    def test_anonymous_public_payload_carries_no_presence(self):
        Profile.objects.filter(pk=self.profile.pk).update(last_active_at=timezone.now())
        self.profile.refresh_from_db()

        data = profile_to_api(self.profile, None, public=True)
        self.assertNotIn("presence", data)

    def test_signed_in_viewer_sees_presence_on_a_public_payload(self):
        Profile.objects.filter(pk=self.profile.pk).update(last_active_at=timezone.now())
        self.profile.refresh_from_db()

        data = profile_to_api(self.profile, None, public=True, viewer=self.profile)
        self.assertTrue(data["presence"]["isOnline"])

    def test_own_payload_always_carries_the_key(self):
        data = profile_to_api(self.profile, None, public=False)
        self.assertIn("presence", data)


def _member(username, gender="M"):
    """A profile that is visible in matches - gender is what pairs them up."""
    user = User.objects.create_user(username=username, password="x")
    profile = Profile.objects.get(user=user)
    profile.gender = gender
    profile.first_name = username.title()
    profile.save()
    return profile


class InterestTests(TestCase):
    def setUp(self):
        self.asha = _member("asha-i", "F")
        self.ravi = _member("ravi-i", "M")

    def test_send_creates_pending(self):
        interest, mutual = interests.send(self.asha, self.ravi)
        self.assertEqual(interest.status, Interest.Status.PENDING)
        self.assertFalse(mutual)

    def test_self_interest_is_refused(self):
        with self.assertRaises(interests.InterestError):
            interests.send(self.asha, self.asha)

    def test_crossing_interests_auto_accept_without_duplicating(self):
        """The second person asking is agreement, not a second request."""
        interests.send(self.asha, self.ravi)
        interest, mutual = interests.send(self.ravi, self.asha)

        self.assertTrue(mutual)
        self.assertEqual(interest.status, Interest.Status.ACCEPTED)
        self.assertEqual(Interest.objects.count(), 1)

    def test_repeat_send_is_idempotent_not_a_duplicate(self):
        first, _ = interests.send(self.asha, self.ravi)
        second, _ = interests.send(self.asha, self.ravi)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(Interest.objects.count(), 1)

    def test_live_pair_uniqueness_is_enforced_by_the_database(self):
        """Pins the constraint itself, not the code path that respects it."""
        interests.send(self.asha, self.ravi)
        with self.assertRaises(IntegrityError):
            Interest.objects.create(sender=self.ravi, receiver=self.asha)

    def test_pair_key_is_order_independent(self):
        interest, _ = interests.send(self.asha, self.ravi)
        self.assertEqual(interest.pair_key, interest_pair_key(self.ravi.pk, self.asha.pk))

    def test_accept_is_receiver_only(self):
        interest, _ = interests.send(self.asha, self.ravi)
        with self.assertRaises(interests.InterestError):
            interests.accept(interest.id, self.asha)

        interests.accept(interest.id, self.ravi)
        interest.refresh_from_db()
        self.assertEqual(interest.status, Interest.Status.ACCEPTED)

    def test_withdraw_is_sender_only(self):
        interest, _ = interests.send(self.asha, self.ravi)
        with self.assertRaises(interests.InterestError):
            interests.withdraw(interest.id, self.ravi)

        interests.withdraw(interest.id, self.asha)
        interest.refresh_from_db()
        self.assertEqual(interest.status, Interest.Status.WITHDRAWN)

    def test_answering_twice_is_refused(self):
        interest, _ = interests.send(self.asha, self.ravi)
        interests.accept(interest.id, self.ravi)
        with self.assertRaises(interests.InterestError):
            interests.decline(interest.id, self.ravi)

    def test_withdrawn_can_be_sent_again_immediately(self):
        interest, _ = interests.send(self.asha, self.ravi)
        interests.withdraw(interest.id, self.asha)

        again, _ = interests.send(self.asha, self.ravi)
        self.assertEqual(again.pk, interest.pk)
        self.assertEqual(again.status, Interest.Status.PENDING)

    def test_declined_needs_the_cooldown_before_asking_again(self):
        interest, _ = interests.send(self.asha, self.ravi)
        interests.decline(interest.id, self.ravi)

        with self.assertRaises(interests.InterestError):
            interests.send(self.asha, self.ravi)

    def test_only_one_resend_is_ever_allowed(self):
        interest, _ = interests.send(self.asha, self.ravi)
        interests.decline(interest.id, self.ravi)

        past = timezone.now() - timedelta(days=interests.RESEND_COOLDOWN_DAYS + 1)
        Interest.objects.filter(pk=interest.pk).update(responded_at=past)
        again, _ = interests.send(self.asha, self.ravi)
        self.assertEqual(again.resend_count, 1)

        interests.decline(again.id, self.ravi)
        Interest.objects.filter(pk=interest.pk).update(responded_at=past)
        with self.assertRaises(interests.InterestError):
            interests.send(self.asha, self.ravi)

    def test_daily_cap_refuses_further_sends(self):
        for n in range(interests.MAX_PER_DAY):
            interests.send(self.asha, _member("cap-%d" % n, "M"))

        with self.assertRaises(interests.InterestError) as caught:
            interests.send(self.asha, self.ravi)
        self.assertEqual(caught.exception.status, 429)

    def test_declined_tab_is_sender_only(self):
        """A receiver's own declines are done; listing them invites re-litigation."""
        interest, _ = interests.send(self.asha, self.ravi)
        interests.decline(interest.id, self.ravi)

        self.assertEqual(interests.for_tab(self.asha, "declined").count(), 1)
        self.assertEqual(interests.for_tab(self.ravi, "declined").count(), 0)

    def test_accepted_tab_shows_both_directions(self):
        interest, _ = interests.send(self.asha, self.ravi)
        interests.accept(interest.id, self.ravi)

        self.assertEqual(interests.for_tab(self.asha, "accepted").count(), 1)
        self.assertEqual(interests.for_tab(self.ravi, "accepted").count(), 1)

    def test_counts_separate_outstanding_from_unseen(self):
        interests.send(self.asha, self.ravi)

        before = interests.counts(self.ravi)
        self.assertEqual(before["received_pending"], 1)
        self.assertEqual(before["received_unseen"], 1)

        interests.mark_seen(self.ravi)

        after = interests.counts(self.ravi)
        self.assertEqual(after["received_pending"], 1, "the tab count must survive being seen")
        self.assertEqual(after["received_unseen"], 0, "the dot must clear")

    def test_is_accepted_between_reads_either_direction(self):
        interest, _ = interests.send(self.asha, self.ravi)
        self.assertFalse(interests.is_accepted_between(self.asha, self.ravi))

        interests.accept(interest.id, self.ravi)
        self.assertTrue(interests.is_accepted_between(self.asha, self.ravi))
        self.assertTrue(interests.is_accepted_between(self.ravi, self.asha))


class BlockTests(TestCase):
    def setUp(self):
        self.asha = _member("asha-b", "F")
        self.ravi = _member("ravi-b", "M")

    def test_decline_with_block_stops_further_interest(self):
        interest, _ = interests.send(self.asha, self.ravi)
        interests.decline(interest.id, self.ravi, block=True)

        with self.assertRaises(interests.InterestError) as caught:
            interests.send(self.asha, self.ravi)
        self.assertEqual(caught.exception.status, 403)

    def test_block_is_mutual_in_effect(self):
        Block.objects.create(blocker=self.ravi, blocked=self.asha)
        self.assertTrue(interests.is_blocked_between(self.asha, self.ravi))
        self.assertTrue(interests.is_blocked_between(self.ravi, self.asha))

    def test_blocked_profiles_leave_the_match_pool_both_ways(self):
        self.assertIn(self.ravi, eligible_matches(self.asha))

        Block.objects.create(blocker=self.ravi, blocked=self.asha)

        self.assertNotIn(self.ravi, eligible_matches(self.asha))
        self.assertNotIn(self.asha, eligible_matches(self.ravi))


class MatchTabTests(TestCase):
    def setUp(self):
        self.asha = _member("asha-m", "F")

    def _joined(self, username, days_ago):
        profile = _member(username, "M")
        Profile.objects.filter(pk=profile.pk).update(
            created_at=timezone.now() - timedelta(days=days_ago)
        )
        return profile

    def test_recent_tab_excludes_anyone_older_than_the_window(self):
        fresh = self._joined("fresh-m", 2)
        self._joined("stale-m", RECENTLY_JOINED_DAYS + 5)

        recent = list(recent_match_queryset(self.asha))
        self.assertEqual(recent, [fresh])

    def test_recent_tab_is_ordered_newest_first(self):
        older = self._joined("older-m", 20)
        newer = self._joined("newer-m", 1)

        self.assertEqual(list(recent_match_queryset(self.asha)), [newer, older])

    def test_null_marker_falls_back_to_a_week_not_everything(self):
        """Treating null as the epoch would mark the whole pool new on a first
        load and produce a badge in the hundreds, which means nothing."""
        self._joined("ancient-m", 400)
        recent = self._joined("recent-m", 2)

        self.assertEqual(list(new_match_queryset(self.asha)), [recent])

    def test_new_tab_empties_once_marked_seen(self):
        self._joined("newish-m", 1)
        self.assertEqual(new_match_queryset(self.asha).count(), 1)

        Profile.objects.filter(pk=self.asha.pk).update(last_seen_matches_at=timezone.now())
        self.asha.refresh_from_db()

        self.assertEqual(new_match_queryset(self.asha).count(), 0)

    def test_new_tab_picks_up_someone_who_joined_after_the_marker(self):
        Profile.objects.filter(pk=self.asha.pk).update(
            last_seen_matches_at=timezone.now() - timedelta(days=1)
        )
        self.asha.refresh_from_db()
        joined = self._joined("later-m", 0)

        self.assertEqual(list(new_match_queryset(self.asha)), [joined])

    def test_blocked_profiles_are_absent_from_every_tab(self):
        blocked = self._joined("blocked-m", 1)
        Block.objects.create(blocker=self.asha, blocked=blocked)

        for tab in ("all", "new", "recent"):
            self.assertNotIn(blocked, match_queryset(self.asha, tab), tab)

    def test_public_payload_carries_joined_at_but_not_created_at(self):
        data = profile_to_api(self.asha, None, public=True)
        self.assertIn("joinedAt", data)
        self.assertNotIn("created_at", data)


class RepeatVisitorTests(TestCase):
    def setUp(self):
        self.asha = _member("asha-v", "F")
        self.ravi = _member("ravi-v", "M")
        self.kiran = _member("kiran-v", "M")

    def _view(self, viewer, when=None):
        row = ProfileView.objects.create(viewer=viewer, viewed=self.asha)
        if when is not None:
            ProfileView.objects.filter(pk=row.pk).update(created_at=when)
        return row

    def test_grouping_survives_the_models_own_ordering(self):
        """ProfileView.Meta.ordering is ["-created_at"], and Django folds an
        active ordering column into the GROUP BY. Without `.order_by()` this
        returns one row per view instead of one per viewer - silently."""
        now = timezone.now()
        for minutes in (1, 2, 3):
            self._view(self.ravi, now - timedelta(minutes=minutes))

        rows = list(visitor_rows(self.asha))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["visits"], 3)

    def test_one_view_is_not_a_repeat(self):
        self._view(self.ravi)
        rows = list(visitor_rows(self.asha))
        self.assertEqual(rows[0]["visits"], 1)
        self.assertEqual(list(visitor_rows(self.asha, repeat_only=True)), [])

    def test_two_views_make_a_repeat_visitor(self):
        self._view(self.ravi)
        self._view(self.ravi)
        self.assertEqual(len(list(visitor_rows(self.asha, repeat_only=True))), 1)

    def test_a_heavy_viewer_does_not_crowd_out_the_list(self):
        """The old implementation read 160 rows and de-duplicated in Python, so
        one viewer with 160 visits returned a single visitor."""
        for _ in range(200):
            self._view(self.ravi)
        self._view(self.kiran)

        viewers = {row["viewer"] for row in visitor_rows(self.asha)}
        self.assertEqual(viewers, {self.ravi.pk, self.kiran.pk})

    def test_ordering_is_by_latest_visit_not_by_count(self):
        now = timezone.now()
        self._view(self.ravi, now - timedelta(hours=5))
        self._view(self.ravi, now - timedelta(hours=4))
        self._view(self.kiran, now - timedelta(minutes=1))

        rows = list(visitor_rows(self.asha))
        self.assertEqual(rows[0]["viewer"], self.kiran.pk)

    def test_hidden_visitors_are_excluded(self):
        self._view(self.ravi)
        Profile.objects.filter(pk=self.ravi.pk).update(hide=True)

        self.assertEqual(list(visitor_rows(self.asha)), [])


class StatsCounterTests(TestCase):
    """The dashboard reads these; `counts()` computed them and the endpoint
    used to drop them on the floor."""

    def setUp(self):
        self.asha = _member("asha-s", "F")
        self.ravi = _member("ravi-s", "M")
        self.kiran = _member("kiran-s", "M")

    def test_sent_and_declined_reach_the_stats_payload(self):
        from apps.profiles.api import profile_stats

        pending, _ = interests.send(self.asha, self.ravi)
        turned_down, _ = interests.send(self.asha, self.kiran)
        interests.decline(turned_down.id, self.kiran)

        request = SimpleNamespace(user=self.asha.user, build_absolute_uri=lambda url: url)
        stats = profile_stats(request)

        self.assertEqual(stats["interests_sent"], 1, "one still awaiting a reply")
        self.assertEqual(stats["interests_declined"], 1)
        # The keys it already had must keep working.
        self.assertIn("interests_received", stats)
        self.assertIn("interests_accepted", stats)

    def test_counters_agree_with_the_tabs_they_link_to(self):
        """Each card is a link, so a figure that disagrees with its own list
        sends people to an empty page."""
        from apps.profiles.api import profile_stats

        interests.send(self.asha, self.ravi)
        request = SimpleNamespace(user=self.asha.user, build_absolute_uri=lambda url: url)
        stats = profile_stats(request)

        self.assertEqual(stats["interests_sent"], interests.for_tab(self.asha, "sent").count())
        self.assertEqual(
            stats["interests_declined"], interests.for_tab(self.asha, "declined").count()
        )


class TrendingTests(TestCase):
    """The rail carries real signals - a promoted list is the thing members
    learn to scroll past."""

    def setUp(self):
        self.asha = _member("asha-t", "F")

    def _man(self, username, days_ago=0):
        profile = _member(username, "M")
        if days_ago:
            Profile.objects.filter(pk=profile.pk).update(
                created_at=timezone.now() - timedelta(days=days_ago)
            )
        return profile

    def _views(self, viewed, n, days_ago=0):
        for i in range(n):
            viewer = _member(f"viewer-{viewed.pk}-{i}", "F")
            row = ProfileView.objects.create(viewer=viewer, viewed=viewed)
            if days_ago:
                ProfileView.objects.filter(pk=row.pk).update(
                    created_at=timezone.now() - timedelta(days=days_ago)
                )

    def test_trending_is_ordered_by_recent_views(self):
        quiet = self._man("quiet-t")
        popular = self._man("popular-t")
        self._views(quiet, 1)
        self._views(popular, 4)

        self.assertEqual(list(trending_queryset(self.asha, "trending"))[0], popular)

    def test_views_outside_the_window_do_not_count(self):
        stale = self._man("stale-t")
        self._views(stale, 9, days_ago=TRENDING_WINDOW_DAYS + 3)

        self.assertEqual(list(trending_queryset(self.asha, "trending")), [])

    def test_online_reads_the_presence_column(self):
        away = self._man("away-t")
        here = self._man("here-t")
        Profile.objects.filter(pk=here.pk).update(last_active_at=timezone.now())
        Profile.objects.filter(pk=away.pk).update(
            last_active_at=timezone.now() - timedelta(hours=3)
        )

        self.assertEqual(list(trending_queryset(self.asha, "online")), [here])

    def test_new_is_the_last_week_only(self):
        fresh = self._man("fresh-t", days_ago=2)
        self._man("older-t", days_ago=TRENDING_WINDOW_DAYS + 4)

        self.assertEqual(list(trending_queryset(self.asha, "new")), [fresh])

    def test_every_tab_respects_the_match_pool(self):
        """Blocked and hidden profiles must not reappear via the rail."""
        blocked = self._man("blocked-t")
        self._views(blocked, 5)
        Block.objects.create(blocker=self.asha, blocked=blocked)

        for tab in ("trending", "online", "new"):
            self.assertNotIn(blocked, trending_queryset(self.asha, tab), tab)


class FamilyMemberTests(TestCase):
    def setUp(self):
        self.asha = _member("asha-f", "F")

    def _add(self, relation, **kwargs):
        return FamilyMember.objects.create(profile=self.asha, relation=relation, **kwargs)

    def test_generation_places_relations_on_the_right_row(self):
        """The graph's layout comes from the model, so the two cannot drift."""
        self.assertEqual(self._add(FamilyMember.Relation.GRANDFATHER).generation, -2)
        self.assertEqual(self._add(FamilyMember.Relation.FATHER).generation, -1)
        self.assertEqual(self._add(FamilyMember.Relation.SISTER).generation, 0)

    def test_unknown_relations_sit_on_the_members_own_row(self):
        """`GENERATION` is a lookup with a default, so a relation added later
        renders somewhere sensible rather than crashing the graph."""
        member = self._add(FamilyMember.Relation.OTHER)
        self.assertEqual(member.generation, 0)

    def test_members_are_ordered_by_position(self):
        second = self._add(FamilyMember.Relation.BROTHER, position=2, name="B")
        first = self._add(FamilyMember.Relation.FATHER, position=1, name="A")

        self.assertEqual(list(self.asha.family_members.all()), [first, second])

    def test_deleting_a_profile_takes_its_family(self):
        self._add(FamilyMember.Relation.MOTHER)
        self.asha.user.delete()
        self.assertEqual(FamilyMember.objects.count(), 0)

    def test_a_family_member_needs_no_account(self):
        """A father who is not a member has no profile of his own; requiring
        one would empty the feature."""
        member = self._add(FamilyMember.Relation.FATHER, name="Ravi", occupation="Teacher")
        self.assertEqual(member.name, "Ravi")
        self.assertFalse(hasattr(member, "user"))


class FamilyApiTests(TestCase):
    def setUp(self):
        self.asha = _member("asha-fa", "F")
        self.ravi = _member("ravi-fa", "M")
        self.request = SimpleNamespace(
            user=self.asha.user, build_absolute_uri=lambda url: url, auth=self.asha
        )

    def test_a_hidden_profiles_family_is_hidden_with_it(self):
        from apps.profiles.family_api import public_family

        # A profile_id is only assigned once gender AND age are set, and the
        # endpoint looks members up by it.
        self.ravi.age = 30
        self.ravi.save()
        self.ravi.refresh_from_db()
        self.assertTrue(self.ravi.profile_id, "fixture needs a profile_id to be found at all")

        FamilyMember.objects.create(profile=self.ravi, relation="father", name="Suresh")

        # Visible first, so the test proves the hiding rather than the lookup.
        self.assertEqual(len(public_family(self.request, self.ravi.profile_id)["results"]), 1)

        Profile.objects.filter(pk=self.ravi.pk).update(hide=True)

        with self.assertRaises(HttpError) as caught:
            public_family(self.request, self.ravi.profile_id)
        self.assertEqual(caught.exception.status_code, 404)

    def test_you_cannot_edit_somebody_elses_family(self):
        """404 and not 403 - a 403 confirms the row exists."""
        from apps.profiles.family_api import _owned

        theirs = FamilyMember.objects.create(profile=self.ravi, relation="mother")

        with self.assertRaises(HttpError) as caught:
            _owned(self.request, theirs.pk)
        self.assertEqual(caught.exception.status_code, 404)

    def test_the_cap_is_enforced(self):
        from apps.profiles.family_api import MemberIn, add_member

        for i in range(FamilyMember.MAX_PER_PROFILE):
            FamilyMember.objects.create(profile=self.asha, relation="other", position=i)

        with self.assertRaises(HttpError) as caught:
            add_member(self.request, MemberIn(relation="brother"))
        self.assertEqual(caught.exception.status_code, 409)

    def test_an_unknown_relation_is_refused(self):
        from apps.profiles.family_api import MemberIn, add_member

        with self.assertRaises(HttpError) as caught:
            add_member(self.request, MemberIn(relation="pet-dog"))
        self.assertEqual(caught.exception.status_code, 400)


class FamilyPhotoTests(TestCase):
    """The upload path, end to end through Django's own multipart parsing."""

    def setUp(self):
        self.user = User.objects.create_user(username="asha-ph", password="x")
        self.profile = Profile.objects.get(user=self.user)
        self.profile.gender = "F"
        self.profile.save()
        self.member = FamilyMember.objects.create(
            profile=self.profile, relation="brother", name="Arun"
        )

    def _png(self):
        """The smallest valid PNG - enough for ImageField to accept it."""
        import base64
        return base64.b64decode(
            b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        )

    def test_a_multipart_upload_attaches_the_photo(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.profiles.family_api import upload_member_photo

        upload = SimpleUploadedFile("arun.png", self._png(), content_type="image/png")
        request = SimpleNamespace(user=self.user, build_absolute_uri=lambda url: url)

        result = upload_member_photo(request, self.member.pk, file=upload)

        self.member.refresh_from_db()
        self.assertTrue(self.member.photo, "the file should be attached to the row")
        self.assertIsNotNone(result["photo"])

    def test_a_non_image_is_refused(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.profiles.family_api import upload_member_photo

        upload = SimpleUploadedFile("notes.txt", b"hello", content_type="text/plain")
        request = SimpleNamespace(user=self.user, build_absolute_uri=lambda url: url)

        with self.assertRaises(HttpError) as caught:
            upload_member_photo(request, self.member.pk, file=upload)
        self.assertEqual(caught.exception.status_code, 400)

    def test_you_cannot_attach_a_photo_to_somebody_elses_family(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from apps.profiles.family_api import upload_member_photo

        other = _member("ravi-ph", "M")
        theirs = FamilyMember.objects.create(profile=other, relation="father")

        upload = SimpleUploadedFile("x.png", self._png(), content_type="image/png")
        request = SimpleNamespace(user=self.user, build_absolute_uri=lambda url: url)

        with self.assertRaises(HttpError) as caught:
            upload_member_photo(request, theirs.pk, file=upload)
        self.assertEqual(caught.exception.status_code, 404)
