"""Fill `managed_by` from what `profile_for` already implies.

Every existing profile answered "who is this for?" at sign-up, so the obvious
manager is known for all of them. Backfilling means nobody has to re-answer, and
existing profiles show the line immediately rather than only after a re-save.

The edge cases `profile_for` cannot express - cousin, guardian, friend - are
exactly the ones this migration cannot guess, and they are left blank on
purpose. `managed_by.resolve()` falls back to the same derivation at read time,
so a blank still reads correctly.
"""

from django.db import migrations

# Mirrors apps.profiles.managed_by.FROM_PROFILE_FOR as of this migration.
# Inlined deliberately: a migration must keep doing what it did on the day it
# was written, even after the live mapping changes.
FROM_PROFILE_FOR = {
    "self": "self",
    "son": "parent",
    "daughter": "parent",
    "brother": "sibling",
    "sister": "sibling",
}


def forwards(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")

    updates = []
    for profile in Profile.objects.all().iterator():
        if profile.managed_by:
            continue
        implied = FROM_PROFILE_FOR.get((profile.profile_for or "").strip(), "")
        if implied:
            profile.managed_by = implied
            updates.append(profile)

    if updates:
        Profile.objects.bulk_update(updates, ["managed_by"], batch_size=500)


def backwards(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")
    Profile.objects.update(managed_by="")


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0023_profile_managed_by"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
