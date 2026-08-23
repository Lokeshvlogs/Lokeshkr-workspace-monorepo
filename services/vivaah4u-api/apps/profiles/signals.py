from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User

from .models import Profile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Give every new User an empty Profile.

    Only the FK is set here - every other column already has a model-level
    default. `profile_id` is intentionally left blank: it encodes gender and age,
    which are not known until apps.auth_api.api.register fills them in.
    """
    if created:
        Profile.objects.get_or_create(user=instance)
