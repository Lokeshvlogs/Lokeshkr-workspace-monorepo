# models.py
from django.conf import settings
from django.db import models
from django.contrib.auth.models import User  # built-in user
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

from . import education
from .constants import PROFILE_COMPLETE_THRESHOLD
from .verification import VerificationLevel, compute_level

class Profile(models.Model):

    id = models.BigAutoField(primary_key=True)

    SEX_CHOICES = [
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    ]
    FAMILY_TYPE_CHOICES = [
        (0, "Nuclear"),
        (1, "Joint"),
        (2, "Extended"),
    ]
    class ManglikChoices(models.IntegerChoices):
        I_DONT_KNOW = 0, "I don't know"
        NO = 1, 'No'
        PARTIAL = 2, 'Anshik/Partial'
        YES = 3, 'Yes'

    profile_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        editable=False
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )
    email = models.EmailField( blank=True,)
    # Set once the sign-up passcode is confirmed. Password login is refused
    # until then, so an unverified number cannot hold an account hostage.
    phone_verified = models.BooleanField(default=False)

    # ---- Verification ----
    #
    # Derived from the evidence flags below by apps.profiles.verification. Never
    # write it directly: Profile.save() recomputes it, and every read surface
    # (API payload, badge, match ordering) reads this column rather than
    # re-deriving the rule.
    verification_level = models.PositiveSmallIntegerField(
        choices=VerificationLevel.choices,
        default=VerificationLevel.NONE,
        db_index=True,
    )
    # When the profile first reached COMPLETE or above. Never cleared, so a
    # later edit that drops the level does not erase when it was earned.
    verified_at = models.DateTimeField(null=True, blank=True)

    # Independent evidence, kept as separate booleans rather than folded into
    # one level, so that changing how evidence maps to a level is a code change
    # in verification.py and never a migration.
    email_verified = models.BooleanField(default=False)
    work_email_verified = models.BooleanField(default=False)   # employer domain
    edu_email_verified = models.BooleanField(default=False)    # institution domain
    photo_verified = models.BooleanField(default=False)        # liveness / selfie
    id_document_verified = models.BooleanField(default=False)  # DigiLocker et al

    # ---- Identity check results ----
    #
    # Populated by nothing today; the provider integration is deliberately out
    # of scope. Designed now so that turning it on needs no schema change.
    #
    # We store the ASSERTION, never the document: no Aadhaar number, no scan, no
    # raw provider payload. An opaque provider reference plus the match results
    # is what is defensible to hold in India, and it survives swapping
    # DigiLocker for a passport or driving-licence provider.
    id_provider = models.CharField(max_length=30, blank=True)   # digilocker|passport|...
    id_reference = models.CharField(max_length=64, blank=True)  # provider txn id ONLY
    id_name_match = models.BooleanField(default=False)
    id_dob_match = models.BooleanField(default=False)
    id_verified_at = models.DateTimeField(null=True, blank=True)

    # Captured at sign-up (see apps.auth_api.api.register)
    PROFILE_FOR_CHOICES = [
        ("son", "Son"),
        ("daughter", "Daughter"),
        ("brother", "Brother"),
        ("sister", "Sister"),
        ("self", "Self"),
    ]
    LOOKING_FOR_CHOICES = [
        ("bride", "Bride"),
        ("groom", "Groom"),
    ]
    profile_for = models.CharField(max_length=20, choices=PROFILE_FOR_CHOICES, blank=True)
    looking_for = models.CharField(max_length=20, choices=LOOKING_FOR_CHOICES, blank=True)

    # Who actually answers the messages.
    #
    # `profile_for` implies this for its five values, but cannot express a
    # cousin, a friend or a guardian - and in arranged-marriage conversations,
    # knowing whether you are speaking to the person or to their father is
    # genuinely useful before the first message.
    #
    # STRICTLY COSMETIC. It must never feed `derive_gender`: that function
    # decides `gender`, which is baked into `profile_id` permanently, so a
    # change here would rewrite someone's public URL.
    MANAGED_BY_CHOICES = [
        ("self", "The member"),
        ("parent", "Parent"),
        ("sibling", "Sibling"),
        ("relative", "Relative"),
        ("guardian", "Guardian"),
        ("friend", "Friend"),
    ]
    managed_by = models.CharField(max_length=20, choices=MANAGED_BY_CHOICES, blank=True)
    country_code = models.CharField(max_length=8, blank=True)
    age = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(18), MaxValueValidator(99)],
    )

    # Basic Info
    first_name = models.CharField(max_length=120, blank=True)
    surname = models.CharField(max_length=120, blank=True)
    name_change_count = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(3)])  # To track name changes with timestamps
    dob_time = models.DateTimeField(blank=True, null=True)
    dob_change_count = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(1)])  # To track DOB changes with timestamps
    gender = models.CharField(max_length=1, choices=SEX_CHOICES, default="M")
    gender_change_count = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(2)])  # To track gender changes with timestamps
    height_feet = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(8)], help_text="Height in feet")
    height_inches = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(11)], help_text="Additional height in inches")
    body_physique = models.CharField(max_length=30, blank=True, help_text="slim / normal / athletic / chubby / heavy")

    marital_status = models.PositiveIntegerField(
        default=0,
        blank=True,
        validators=[MinValueValidator(0),MaxValueValidator(5)],
        choices=[
            (0, "Never Married"),
            (1, "Married"),
            (2, "Divorced"),
            (3, "Widowed"),
            (4, "Annulled"),
            (5, "Awaiting Divorce"),
        ],
    )
    manglik_level = models.PositiveIntegerField(
        choices=ManglikChoices.choices,
        default=ManglikChoices.I_DONT_KNOW,
    )

    # Religious & Cultural Background
    religion = models.CharField(max_length=100, blank=True)
    community = models.CharField(max_length=100, blank=True)
    mother_tongue = models.CharField(max_length=100, blank=True)
    # Location
    current_country = models.CharField(max_length=60, blank=True)
    current_city = models.CharField(max_length=150, blank=True)
    place_of_birth_country = models.CharField(max_length=60, blank=True)
    place_of_birth_city = models.CharField(max_length=150, blank=True)
    # Separate from both of the above: plenty of members were born in one
    # country, live in a second and hold the passport of a third.
    citizenship_country = models.CharField(max_length=60, blank=True)
    # Family Details
    family_living_in_country = models.CharField(max_length=60, blank=True)
    family_living_in_city = models.CharField(max_length=150, blank=True)
    family_type = models.IntegerField(default=0, choices=FAMILY_TYPE_CHOICES, blank=True)
    lives_with_family = models.BooleanField(default=True)
    family_income = models.CharField(max_length=100, blank=True)

    # Optional Additional Fields
    # DERIVED from the ProfileEducation rows - do not write these directly.
    # `refresh_derived_education()` sets them from the highest qualification.
    #
    # Kept as columns rather than replaced by the related table because
    # everything downstream expects a single value: completeness scoring, the
    # match search filter, the compatibility panel and the card headline. One
    # cache here is far less risky than teaching all of those about a list.
    education_level = models.CharField(max_length=200, blank=True)
    field_of_study = models.CharField(max_length=200, blank=True)
    college_university = models.CharField(max_length=200, blank=True)
    # Best tier across the non-school qualifications. Internal - never
    # serialised, and used only for match ranking.
    education_reputation_tier = models.PositiveSmallIntegerField(default=9)
    profession = models.CharField(max_length=150, blank=True)
    employed_in = models.CharField(max_length=150, blank=True)
    employed_as = models.CharField(max_length=150, blank=True)
    annual_income = models.CharField(max_length=100, blank=True)
    # Tri-state as text: "" unanswered, "yes", "no". A boolean could not tell
    # "no" from "not asked", and this is a question many members leave blank.
    settle_abroad = models.CharField(max_length=10, blank=True)

    # ---- Employer ----
    #
    # Same FK-plus-denormalised-name shape as ProfileEducation, for the same
    # reasons: "Other / not listed" has to survive without minting catalog rows
    # from user input, and a deactivated catalog row must not blank a profile.
    #
    # `employer.email_domains` is the hook a work-email OTP will use to turn a
    # claimed job into a verified one.
    employer = models.ForeignKey(
        "catalog.Employer",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    employer_name = models.CharField(max_length=200, blank=True)
    employer_is_other = models.BooleanField(default=False)
    # Internal, never serialised - the employer counterpart of
    # education_reputation_tier.
    employer_reputation_tier = models.PositiveSmallIntegerField(default=9)

    # Where the job is, which is what makes the visa question answerable at all.
    work_country = models.CharField(max_length=2, blank=True)  # ISO-2
    # A value from apps.catalog.visa for `work_country`.
    visa_status = models.CharField(max_length=40, blank=True)

    # Free-form accomplishments: [{"title", "year", "detail"}]. Display only -
    # no joins, no filtering - so a JSON list rather than another table.
    achievements = models.JSONField(default=list, blank=True)

    # ---- Interests ----
    #
    # One column per category rather than a single nested blob. The wizard
    # PATCHes a step at a time and `apply_payload` is key-to-column, so a nested
    # object would need a deep merge - and without one, saving the step would
    # silently clear every category the payload happened not to mention.
    #
    # The shape (category -> list of slugs) maps straight onto a
    # ProfileTag(profile, category, value) table if "find people who also like
    # X" ever needs an index. That is a data migration, not a redesign.
    interests_music = models.JSONField(default=list, blank=True)
    interests_movies = models.JSONField(default=list, blank=True)
    interests_books = models.JSONField(default=list, blank=True)
    interests_cuisines = models.JSONField(default=list, blank=True)
    interests_travel = models.JSONField(default=list, blank=True)
    interests_hobbies = models.JSONField(default=list, blank=True)
    # The one free-text escape hatch, for whatever the lists cannot express.
    interests_other = models.TextField(blank=True)
    #lifestyle choices
    diet = models.CharField(max_length=100, blank=True)
    smoking_habits = models.CharField(max_length=100, blank=True)  
    drinking_habits = models.CharField(max_length=100, blank=True)
    exercise_habits = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)])
    daily_routine = models.CharField(max_length=100, blank=True)
    religiousness = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)])
    astrology_belief = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)])
    has_children = models.BooleanField(default=False)
    wants_children = models.BooleanField(default=True)
      

    # Free-text intro shown at the top of the profile.
    about_me = models.TextField(blank=True)

    # Religious outlook, replacing the old 0-10 `religiousness` slider: a broad
    # stance plus a qualifier, which reads far better on a profile than a number.
    # `religiousness` and `astrology_belief` are retained as columns so existing
    # rows keep their data, but nothing collects or displays them any more.
    religiosity = models.CharField(max_length=30, blank=True)
    religiosity_detail = models.CharField(max_length=40, blank=True)

    # --- Family background (all optional) ---
    father_occupation = models.CharField(max_length=40, blank=True)
    mother_occupation = models.CharField(max_length=40, blank=True)
    brothers = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(10)])
    brothers_married = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(10)])
    sisters = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(10)])
    sisters_married = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(10)])
    family_about = models.TextField(blank=True)

    # --- Partner preference ---
    partner_age_min = models.PositiveIntegerField(null=True, blank=True)
    partner_age_max = models.PositiveIntegerField(null=True, blank=True)
    # Stored in total inches so ranges compare with a single integer.
    partner_height_min = models.PositiveIntegerField(null=True, blank=True)
    partner_height_max = models.PositiveIntegerField(null=True, blank=True)
    partner_marital_status = models.CharField(max_length=30, blank=True)
    partner_religion = models.CharField(max_length=60, blank=True)
    partner_community = models.CharField(max_length=100, blank=True)
    partner_mother_tongue = models.CharField(max_length=100, blank=True)
    partner_country = models.CharField(max_length=60, blank=True)
    partner_education = models.CharField(max_length=200, blank=True)
    partner_profession = models.CharField(max_length=150, blank=True)
    partner_diet = models.CharField(max_length=100, blank=True)
    partner_about = models.TextField(blank=True)

    # ---- Partner preferences, multi-value ----
    #
    # "Hindu or Jain" is a normal thing to want and the singular columns above
    # cannot say it. These supersede them.
    #
    # Added alongside rather than converting the CharFields in place: on SQLite
    # an ALTER to JSON is a table rebuild, and the existing value "hindu" would
    # become a JSON *string* rather than a one-element list. The singular
    # columns are kept for one release so a client that has not picked up the
    # new payload keeps working, and are dropped in a later migration.
    #
    # An empty list is the canonical "no preference" - the literal "any" is
    # stripped on the way in (see mapping._to_str_list), so there is exactly one
    # representation of it rather than two to keep in sync.
    partner_marital_statuses = models.JSONField(default=list, blank=True)
    partner_religions = models.JSONField(default=list, blank=True)
    partner_communities = models.JSONField(default=list, blank=True)
    partner_mother_tongues = models.JSONField(default=list, blank=True)
    partner_countries = models.JSONField(default=list, blank=True)
    partner_educations = models.JSONField(default=list, blank=True)
    partner_professions = models.JSONField(default=list, blank=True)
    partner_diets = models.JSONField(default=list, blank=True)

    # Mobility expectations, the counterpart to `settle_abroad`.
    #
    # Lists, not single answers: someone open to a partner who says "yes" is
    # usually equally happy with "open to discussion", and forcing one choice
    # made them exclude matches they would have wanted. Every selected value is
    # accepted by the matcher; an empty list means no preference at all.
    partner_relocate_after_marriage = models.JSONField(default=list, blank=True)
    partner_settle_abroad = models.JSONField(default=list, blank=True)

    # Display Picture (DP)
    display_picture = models.ImageField(upload_to="profile_pics/", null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # When the member last opened their matches. Only ever moved by an explicit
    # POST, never as a side effect of the GET - see the matches endpoint.
    last_seen_matches_at = models.DateTimeField(null=True, blank=True)

    # Stamped by the authentication class on API activity - see presence.py.
    # Never written through save(), so it does not touch updated_at or trigger
    # a completeness recompute.
    last_active_at = models.DateTimeField(null=True, blank=True, db_index=True)

    hide = models.BooleanField(default=False)
    hide_profile_from_search = models.BooleanField(default=False)
    hide_display_picture_from_search = models.BooleanField(default=False)
    profile_completeness = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])

    # ---- Core completeness ----
    #
    # FROZEN. These are the fields that decide ELIGIBILITY - whether a member
    # appears in matches and whether login bounces them into the wizard, via
    # `core_completeness()` against PROFILE_COMPLETE_THRESHOLD.
    #
    # New profile fields must NOT be added here. They go in the EXTRA_* lists
    # below, which feed the headline percentage only. Adding one here changes
    # the denominator for every existing member at once: there is a single slot
    # of headroom at the 95 threshold (28/29 = 97 passes, 27/29 = 93 fails), so
    # one addition drops everyone currently sitting at 97 out of match results
    # and back into the wizard on their next login.
    #
    # The client mirrors this list in
    # apps/vivaah4you-web/src/lib/profileCompletion.ts - edit both together.
    #
    # Optional sections (family background, partner preference, the free-text
    # intros) are excluded so a member who skips them can still reach 100%.
    # Also excludes fields whose zero value is a real answer (marital_status,
    # manglik_level, family_type, exercise_habits) - there is no way to tell
    # "Never Married" from "unanswered", so counting them would make 100%
    # unreachable or inflate every new profile.
    COMPLETENESS_TEXT_FIELDS = [
        "first_name", "surname",
        "religion", "community", "mother_tongue",
        "current_country", "current_city",
        "place_of_birth_country", "place_of_birth_city",
        "family_living_in_country", "family_living_in_city", "family_income",
        "education_level", "field_of_study", "college_university",
        "profession", "employed_in", "employed_as", "annual_income",
        "diet", "smoking_habits", "drinking_habits",
        "body_physique", "religiosity",
    ]
    # 0 means "not set yet" for these (nobody is 0 feet tall / physique is a 1-10 scale).
    COMPLETENESS_POSITIVE_FIELDS = [
        "height_feet",
    ]

    # ---- Extra completeness ----
    #
    # Everything the wizard asks for beyond the core. These count towards the
    # headline percentage the member sees, and towards nothing else: they can
    # be added and removed freely without moving anybody's eligibility.
    #
    # Adding here DOES lower every existing member's displayed percentage, which
    # is intended - the profile genuinely asks for more now. What it must never
    # do is change `is_complete`; `manage.py check_profile_drift` verifies that.
    EXTRA_TEXT_FIELDS: list[str] = [
        "daily_routine",
        "settle_abroad",
        # Required by the wizard, but deliberately outside the core set: the
        # column is blank on every profile that predates it, and promoting it
        # to core would drop those members below the eligibility bar for a
        # question they were never asked.
        "citizenship_country",
    ]
    # JSON list columns; a non-empty list counts as one answered slot.
    #
    # `interests_other` is deliberately absent: it is the free-text escape
    # hatch, and scoring it would push people to write something just to move a
    # number.
    EXTRA_LIST_FIELDS: list[str] = [
        "interests_music",
        "interests_movies",
        "interests_books",
        "interests_cuisines",
        "interests_travel",
        "interests_hobbies",
    ]

    def _count_filled(self, text_fields, positive_fields=(), list_fields=()) -> int:
        filled = 0
        for name in text_fields:
            if str(getattr(self, name, "") or "").strip():
                filled += 1
        for name in positive_fields:
            if (getattr(self, name, 0) or 0) > 0:
                filled += 1
        for name in list_fields:
            if getattr(self, name, None):
                filled += 1
        return filled

    # dob_time, age, gender, display_picture - counted by hand below.
    CORE_EXTRA_SLOTS = 4

    def _core_filled(self) -> int:
        filled = self._count_filled(
            self.COMPLETENESS_TEXT_FIELDS, self.COMPLETENESS_POSITIVE_FIELDS
        )
        if self.dob_time is not None:
            filled += 1
        if self.age:
            filled += 1
        if str(self.gender or "").strip():
            filled += 1
        if self.display_picture:
            filled += 1
        return filled

    def _core_total(self) -> int:
        return (
            len(self.COMPLETENESS_TEXT_FIELDS)
            + len(self.COMPLETENESS_POSITIVE_FIELDS)
            + self.CORE_EXTRA_SLOTS
        )

    def core_completeness(self) -> int:
        """Percentage of the CORE field set that has real answers.

        This is what eligibility is measured against, and it is deliberately
        blind to every field added after launch - see the comment on
        COMPLETENESS_TEXT_FIELDS for why.
        """
        return round(self._core_filled() * 100 / self._core_total())

    @property
    def is_complete(self) -> bool:
        """Whether the member is eligible for match results."""
        return self.core_completeness() >= PROFILE_COMPLETE_THRESHOLD

    def compute_completeness(self) -> int:
        """The headline percentage the member sees.

        Core plus every extra field the wizard has grown. While the EXTRA_*
        lists are empty this is identical to `core_completeness()`, so adding
        the first extra field is the moment percentages start moving - which is
        exactly why nothing reads this number to decide eligibility.
        """
        filled = self._core_filled() + self._count_filled(
            self.EXTRA_TEXT_FIELDS, list_fields=self.EXTRA_LIST_FIELDS
        )
        total = (
            self._core_total()
            + len(self.EXTRA_TEXT_FIELDS)
            + len(self.EXTRA_LIST_FIELDS)
        )
        return round(filled * 100 / total)

    def refresh_derived_education(self) -> None:
        """Recompute the cached education columns from the related rows.

        Must run BEFORE save(), because completeness scores `education_level`
        and would otherwise read the previous value.

        Deliberately a no-op when a member has no education rows at all: that is
        every profile created before the education table existed, and blanking
        their `education_level` would drop their completeness - and with it
        their eligibility - for no reason.
        """
        entries = list(self.educations.select_related("institution").all())
        if not entries:
            return

        best = education.best_entry(entries)
        if best is not None:
            self.education_level = best.level
            self.field_of_study = best.field_of_study
            self.college_university = best.institution_name

        self.education_reputation_tier = education.best_reputation_tier(entries)

    def build_profile_id(self) -> str:
        """Public id: brand + gender + age + row number, e.g. V4UF28000042."""
        gender = (self.gender or "O")[:1].upper()
        age = self.age or 0
        return f"V4U{gender}{age:02d}{self.pk:06d}"

    def assign_profile_id(self, force: bool = False) -> None:
        """Freeze the public id once gender and age are known.

        Kept stable afterwards even though `age` changes every year - the id is a
        permanent handle used in public profile URLs.
        """
        if self.pk and (force or not self.profile_id) and self.gender and self.age:
            self.profile_id = self.build_profile_id()

    # Columns recomputed on every save. Any caller passing `update_fields` has
    # these folded in for it - otherwise the recompute happens in memory and is
    # then dropped on the way to the database. Three callers in auth_api do
    # exactly that (change_phone, change_email, verify), and the bug is silent.
    DERIVED_FIELDS = ("profile_completeness", "verification_level", "verified_at")

    def save(self, *args, **kwargs):
        self.profile_completeness = self.compute_completeness()

        # Order matters: compute_level reads profile_completeness, so the line
        # above has to run first.
        self.verification_level = compute_level(self)
        if self.verified_at is None and self.verification_level >= VerificationLevel.COMPLETE:
            # Stamped once and never cleared - a later edit that drops the level
            # should not erase the fact that it was earned.
            self.verified_at = timezone.now()

        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            kwargs["update_fields"] = set(update_fields) | set(self.DERIVED_FIELDS)

        super().save(*args, **kwargs)

        if not self.profile_id and self.gender and self.age:
            self.assign_profile_id()
            # Calls super() directly, so it does not re-enter this method.
            super().save(update_fields=["profile_id"])

    def __str__(self):
        return f"{self.user.username} {self.surname} ({self.dob_time.strftime('%Y-%m-%d') if self.dob_time else 'DOB not set'})"


class ProfileEducation(models.Model):
    """One qualification. A member may list several.

    The institution is stored twice on purpose: an FK to the catalog when it was
    picked from the list, and the name denormalised alongside it always.

    - "Other / not listed" has to survive, and a pure FK could only represent it
      by minting catalog rows from user input - which would pollute everybody
      else's typeahead with typos and joke entries.
    - The denormalised name means serialising never joins and never null-checks,
      and deactivating or merging a catalog row cannot blank someone's profile.
    """

    MAX_PER_PROFILE = 5

    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="educations"
    )
    # Display order, exactly like ProfilePhoto.position. NOT the level order:
    # someone may want their most recent qualification first regardless of rank.
    position = models.PositiveSmallIntegerField(default=0)

    level = models.CharField(max_length=40)  # an `educationOptions` value
    field_of_study = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=2, blank=True)  # ISO-2

    # SET_NULL, never CASCADE: removing reference data must never delete a
    # member's history.
    institution = models.ForeignKey(
        "catalog.Institution",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    institution_name = models.CharField(max_length=200, blank=True)
    institution_country = models.CharField(max_length=2, blank=True)
    is_other = models.BooleanField(default=False)
    # Only meaningful when is_other. The member's own claim that the place is
    # well regarded; unverified, and ranked accordingly (see education.tier_for).
    reputation_claimed = models.BooleanField(default=False)

    completion_year = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return f"{self.level} @ {self.institution_name or 'unspecified'}"


class ProfilePhoto(models.Model):
    """Extra gallery photos beyond `Profile.display_picture`.

    The display picture stays on Profile so existing code and the matches feed
    keep working unchanged; these are purely additional and always optional.
    """

    MAX_PER_PROFILE = 6

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="profile_photos/")
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return f"{self.profile.profile_id or self.profile_id} photo {self.position}"


class ProfileView(models.Model):
    """One member opening another member's profile.

    Every visit is stored rather than one row per pair: "12 views from 4 people"
    is a more useful signal than "4 people", and de-duplication is a query
    concern, not a storage one. Anonymous visits are not recorded at all - there
    is nobody to show in the visitors list.
    """

    viewer = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="views_made"
    )
    viewed = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="views_received"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            # Serves both the visitors list and the 30-day counts.
            models.Index(fields=["viewed", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.viewer_id} viewed {self.viewed_id}"


def interest_pair_key(a_id: int, b_id: int) -> str:
    """An order-independent key for the two profiles in an interest.

    Sorted, so A->B and B->A produce the same string. That is what lets a
    database constraint enforce "at most one live thread per pair, in either
    direction" instead of leaving it to two code paths to remember.
    """
    lo, hi = sorted((int(a_id), int(b_id)))
    return f"{lo}:{hi}"


class Interest(models.Model):
    """One member asking another to connect.

    Stored as a single directed row with a status, not as a mirrored pair.
    "Received" is a point of view, not a state: mirroring it would mean two
    statuses to keep in step on every transition, and the classic failure is
    the sender seeing "accepted" while the receiver still sees "pending".
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Awaiting a reply"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        WITHDRAWN = "withdrawn", "Withdrawn by the sender"

    #: Statuses that occupy the pair. Only one of these may exist per pair.
    LIVE_STATUSES = (Status.PENDING, Status.ACCEPTED)

    sender = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="interests_sent"
    )
    receiver = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="interests_received"
    )
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)

    #: See `interest_pair_key`. Maintained in save(); never set by hand.
    pair_key = models.CharField(max_length=40, db_index=True, editable=False)

    message = models.CharField(max_length=280, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    #: When the receiver last opened their inbox past this row. Distinct from
    #: status on purpose - "seen but not yet answered" is a real and common
    #: state, and it is what clears the red dot without clearing the count.
    seen_at = models.DateTimeField(null=True, blank=True)

    #: Times this pair has been reopened after a decline. A counter rather than
    #: a boolean so the policy can be relaxed later without a migration.
    resend_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["sender", "receiver"], name="uniq_interest_direction"
            ),
            # The important one: makes it physically impossible for A->B and
            # B->A to both be live, which forces the crossing case through the
            # auto-accept path rather than producing two half-threads.
            models.UniqueConstraint(
                fields=["pair_key"],
                condition=models.Q(status__in=["pending", "accepted"]),
                name="uniq_live_interest_per_pair",
            ),
            models.CheckConstraint(
                check=~models.Q(sender=models.F("receiver")), name="interest_not_self"
            ),
        ]
        indexes = [
            models.Index(fields=["receiver", "status", "-created_at"]),
            models.Index(fields=["sender", "status", "-created_at"]),
        ]

    def save(self, *args, **kwargs):
        self.pair_key = interest_pair_key(self.sender_id, self.receiver_id)
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            kwargs["update_fields"] = set(update_fields) | {"pair_key"}
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.sender_id} -> {self.receiver_id} ({self.status})"


class Block(models.Model):
    """One member refusing all contact from another.

    Deliberately one-directional in storage and two-directional in effect: the
    blocked member must not be able to tell, so every query that consults this
    checks both columns.
    """

    blocker = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="blocks_made"
    )
    blocked = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="blocks_received"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["blocker", "blocked"], name="uniq_block"),
        ]
        indexes = [models.Index(fields=["blocked", "blocker"])]

    def __str__(self):
        return f"{self.blocker_id} blocked {self.blocked_id}"


class FamilyMember(models.Model):
    """One person in a member's family.

    The profile already carries counts and two occupations - "2 brothers, 1
    sister, father an engineer". That is enough to score completeness and not
    nearly enough to picture a family, which is what both sides are actually
    weighing up. These are the named people behind those numbers.

    Deliberately not linked to a Profile of their own: a father who is not a
    member has no account, and requiring one would empty the feature.
    """

    class Relation(models.TextChoices):
        FATHER = "father", "Father"
        MOTHER = "mother", "Mother"
        BROTHER = "brother", "Brother"
        SISTER = "sister", "Sister"
        GRANDFATHER = "grandfather", "Grandfather"
        GRANDMOTHER = "grandmother", "Grandmother"
        OTHER = "other", "Other"

    #: Which generation a relation belongs on, for laying the graph out. The
    #: member is 0; older is negative, so the tree reads top to bottom.
    GENERATION = {
        Relation.GRANDFATHER: -2,
        Relation.GRANDMOTHER: -2,
        Relation.FATHER: -1,
        Relation.MOTHER: -1,
        Relation.BROTHER: 0,
        Relation.SISTER: 0,
        Relation.OTHER: 0,
    }

    # The wizard allows 6 brothers + 6 sisters + 2 parents, and a joint family
    # adds grandparents on top - a cap of 12 refused people the form had just
    # invited the member to name.
    MAX_PER_PROFILE = 20

    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name="family_members"
    )
    relation = models.CharField(max_length=20, choices=Relation.choices)
    name = models.CharField(max_length=80, blank=True)
    occupation = models.CharField(max_length=80, blank=True)
    #: Free text rather than a date: "mid 50s" is what people actually know
    #: about an in-law, and an exact birthday is more than this needs.
    about = models.CharField(max_length=140, blank=True)
    photo = models.ImageField(upload_to="family_photos/", null=True, blank=True)
    is_married = models.BooleanField(default=False)

    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "id"]
        indexes = [models.Index(fields=["profile", "position"])]

    @property
    def generation(self) -> int:
        return self.GENERATION.get(self.relation, 0)

    def __str__(self):
        return f"{self.get_relation_display()} of {self.profile_id}"
