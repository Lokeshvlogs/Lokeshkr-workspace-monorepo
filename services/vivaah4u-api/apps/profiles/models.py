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
    body_physique = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)], help_text="1-10 scale for body physique")

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
    employed_as = models.CharField(max_length=150, blank=True)
    annual_income = models.CharField(max_length=100, blank=True)
    #lifestyle choices
    diet = models.CharField(max_length=100, blank=True)
    smoking_habits = models.CharField(max_length=100, blank=True)  
    drinking_habits = models.CharField(max_length=100, blank=True)
    exercise_habits = models.CharField(max_length=100, blank=True)
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

    def __str__(self):
        return f"{self.user.username} {self.surname} ({self.dob_time.strftime('%Y-%m-%d') if self.dob_time else 'DOB not set'})"
