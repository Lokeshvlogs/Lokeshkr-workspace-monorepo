"""Give existing profiles their verification level.

`verification_level` defaults to NONE, and it is only recomputed on save, so
without this every member sits at "not verified" until they next edit something.

Follows the shape of 0012_profile_phone_verified, which grandfathered existing
rows the same way.
"""

from django.db import migrations


def backfill(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")

    # The historical model has no methods, so the rule is inlined here rather
    # than imported from verification.py. That is deliberate: a migration must
    # keep doing what it did on the day it was written, even after the live rule
    # changes. Mirrors compute_level() as of 0014.
    NONE, BASIC, COMPLETE, ID_VERIFIED = 0, 1, 2, 3

    updates = []
    for profile in Profile.objects.all().iterator():
        if profile.id_document_verified:
            level = ID_VERIFIED
        elif profile.phone_verified and profile.profile_completeness >= 100:
            level = COMPLETE
        elif profile.phone_verified:
            level = BASIC
        else:
            level = NONE

        if profile.verification_level != level:
            profile.verification_level = level
            updates.append(profile)

    if updates:
        Profile.objects.bulk_update(updates, ["verification_level"], batch_size=500)


def unset(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")
    Profile.objects.update(verification_level=0, verified_at=None)


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0014_profile_edu_email_verified_profile_email_verified_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill, unset),
    ]
