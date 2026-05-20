from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    print(f"Signal received for User: instance={instance}, created={created}")
    if created:
        # Provide minimal sensible defaults for required Profile fields so
        # automatic creation on User signup doesn't violate NOT NULL constraints.
        Profile.objects.create(
            profile_id=f"V4U{instance.id:06d}",  # e.g., V4U000001
            user=instance,
            first_name= "",
            surname= "",
            name_change_count = 0,
            dob_time = None,
            dob_change_count = 0,
            gender = "O",
            gender_change_count = 0,
            height_feet=0,
            height_inches=0,
            body_physique=0,
            marital_status=0,
            manglik_level=0,
            religion="",
            community="",
            mother_tongue="",
            current_country="",
            current_city="",
            place_of_birth_country="",
            place_of_birth_city="",
            family_living_in_country="",
            family_living_in_city="",
            family_type=0,
            lives_with_family=True,
            family_income="",
            education_level="",
            field_of_study="",
            college_university="",
            profession="",
            employed_as="",
            annual_income="",
            diet="",
            smoking_habits="",
            drinking_habits="",
            exercise_habits="",
            daily_routine="",
            religiousness=0,
            astrology_belief=0,
            has_children=False,
            wants_children=True,
            display_picture=None,
            hide=False,
            hide_profile_from_search=False,
            hide_display_picture_from_search=False,
            profile_completeness=0,
        )
        print(f"Profile created for user {instance.username}")
        
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
    print(f"Profile saved for user {instance.username}")