"""Tests pinning the profile-completeness invariants.

These exist because completeness is load-bearing in a way that is easy to break
silently: it decides whether a member appears in match results and whether login
bounces them back into the registration wizard. There is exactly one slot of
headroom at the 95% threshold, so adding a single scored field to the core set
drops every member currently sitting at 97% out of the product.

Run with:  service.bat vivaah4u-api test
"""

import json

from django.contrib.auth.models import User
from django.test import TestCase

from apps.catalog.models import Employer, Institution

from apps.profiles.constants import PROFILE_COMPLETE_THRESHOLD
from apps.profiles.mapping import (
    MAX_LIST_ITEMS,
    MAX_LIST_VALUE_LENGTH,
    apply_payload,
    profile_to_api,
)
from apps.profiles import managed_by as managed_by_rules
from apps.profiles.education import NO_REPUTATION, rank_of
from apps.profiles.models import Profile, ProfileEducation
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
        apply_payload(self.profile, {"interestsMusic": ["ghazal", "sufi"]})
        self.assertEqual(self.profile.interests_music, ["ghazal", "sufi"])

    def test_each_category_is_independent(self):
        """One column per category, so saving one must not clear the others.

        This is the whole reason these are flat columns rather than a nested
        blob: apply_payload is key-to-column, and a partial payload of a nested
        object would wipe every category it did not mention.
        """
        apply_payload(self.profile, {
            "interestsMusic": ["ghazal"],
            "interestsBooks": ["poetry"],
        })
        apply_payload(self.profile, {"interestsMusic": ["rock"]})
        self.assertEqual(self.profile.interests_music, ["rock"])
        self.assertEqual(self.profile.interests_books, ["poetry"])

    def test_interests_raise_the_headline_percentage(self):
        before = self.profile.compute_completeness()
        apply_payload(self.profile, {
            "interestsMusic": ["ghazal"],
            "interestsMovies": ["comedy"],
            "interestsBooks": ["poetry"],
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
