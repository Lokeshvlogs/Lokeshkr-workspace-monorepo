"""Carry each singular partner preference into its plural column.

Without this, everybody's stated preferences vanish from the UI the moment the
wizard starts reading the plural fields - the data would still be in the old
columns, just no longer looked at.

"any" is dropped rather than carried across: it means "no preference", and the
plural columns represent that as an empty list so there is exactly one way to
say it.
"""

from django.db import migrations

# singular column -> plural column
PAIRS = [
    ("partner_marital_status", "partner_marital_statuses"),
    ("partner_religion", "partner_religions"),
    ("partner_community", "partner_communities"),
    ("partner_mother_tongue", "partner_mother_tongues"),
    ("partner_country", "partner_countries"),
    ("partner_education", "partner_educations"),
    ("partner_profession", "partner_professions"),
    ("partner_diet", "partner_diets"),
]


def forwards(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")

    updates = []
    for profile in Profile.objects.all().iterator():
        changed = False
        for singular, plural in PAIRS:
            if getattr(profile, plural):
                continue  # already populated; never clobber
            value = (getattr(profile, singular) or "").strip()
            if value and value != "any":
                setattr(profile, plural, [value])
                changed = True
        if changed:
            updates.append(profile)

    if updates:
        Profile.objects.bulk_update(
            updates, [plural for _singular, plural in PAIRS], batch_size=500
        )


def backwards(apps, schema_editor):
    """Return to a single value.

    Lossy by nature - a member who picked three religions can only be
    represented by one. The first is kept, which is the one the old UI would
    have shown.
    """
    Profile = apps.get_model("profiles", "Profile")

    updates = []
    for profile in Profile.objects.all().iterator():
        changed = False
        for singular, plural in PAIRS:
            values = getattr(profile, plural) or []
            if values and not (getattr(profile, singular) or "").strip():
                setattr(profile, singular, values[0])
                changed = True
        if changed:
            updates.append(profile)

    if updates:
        Profile.objects.bulk_update(
            updates, [singular for singular, _plural in PAIRS], batch_size=500
        )


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0016_profile_partner_communities_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
