# models.py
from django.conf import settings
from django.db import models
from django.contrib.auth.models import User  # built-in user
from django.core.validators import MinValueValidator, MaxValueValidator

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
    # Family Details
    family_living_in_country = models.CharField(max_length=60, blank=True)
    family_living_in_city = models.CharField(max_length=150, blank=True)
    family_type = models.IntegerField(default=0, choices=FAMILY_TYPE_CHOICES, blank=True)
    lives_with_family = models.BooleanField(default=True)
    family_income = models.CharField(max_length=100, blank=True)

    # Optional Additional Fields
    education_level = models.CharField(max_length=200, blank=True)
    field_of_study = models.CharField(max_length=200, blank=True)
    college_university = models.CharField(max_length=200, blank=True)
    profession = models.CharField(max_length=150, blank=True)
    employed_in = models.CharField(max_length=150, blank=True)
    employed_as = models.CharField(max_length=150, blank=True)
    annual_income = models.CharField(max_length=100, blank=True)
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
      

    # Display Picture (DP)
    display_picture = models.ImageField(upload_to="profile_pics/", null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    hide = models.BooleanField(default=False)
    hide_profile_from_search = models.BooleanField(default=False)
    hide_display_picture_from_search = models.BooleanField(default=False)
    profile_completeness = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])

    # Fields scored for `profile_completeness`. Deliberately excludes fields whose
    # zero value is a real answer (marital_status, manglik_level, family_type,
    # exercise_habits) - there is no way to tell "Never Married" from "unanswered",
    # so counting them would make 100% unreachable or inflate every new profile.
    COMPLETENESS_TEXT_FIELDS = [
        "first_name", "surname",
        "religion", "community", "mother_tongue",
        "current_country", "current_city",
        "place_of_birth_country", "place_of_birth_city",
        "family_living_in_country", "family_living_in_city", "family_income",
        "education_level", "field_of_study", "college_university",
        "profession", "employed_in", "employed_as", "annual_income",
        "diet", "smoking_habits", "drinking_habits", "daily_routine",
        "body_physique",
    ]
    # 0 means "not set yet" for these (nobody is 0 feet tall / physique is a 1-10 scale).
    COMPLETENESS_POSITIVE_FIELDS = [
        "height_feet", "religiousness", "astrology_belief",
    ]

    def compute_completeness(self) -> int:
        """Percentage of the profile-registration wizard that has real answers."""
        filled = 0
        for name in self.COMPLETENESS_TEXT_FIELDS:
            if str(getattr(self, name, "") or "").strip():
                filled += 1
        for name in self.COMPLETENESS_POSITIVE_FIELDS:
            if (getattr(self, name, 0) or 0) > 0:
                filled += 1
        if self.dob_time is not None:
            filled += 1
        if self.age:
            filled += 1
        if str(self.gender or "").strip():
            filled += 1
        if self.display_picture:
            filled += 1

        total = (
            len(self.COMPLETENESS_TEXT_FIELDS)
            + len(self.COMPLETENESS_POSITIVE_FIELDS)
            + 4  # dob_time, age, gender, display_picture
        )
        return round(filled * 100 / total)

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

    def save(self, *args, **kwargs):
        self.profile_completeness = self.compute_completeness()
        super().save(*args, **kwargs)
        if not self.profile_id and self.gender and self.age:
            self.assign_profile_id()
            super().save(update_fields=["profile_id"])

    def __str__(self):
        return f"{self.user.username} {self.surname} ({self.dob_time.strftime('%Y-%m-%d') if self.dob_time else 'DOB not set'})"
