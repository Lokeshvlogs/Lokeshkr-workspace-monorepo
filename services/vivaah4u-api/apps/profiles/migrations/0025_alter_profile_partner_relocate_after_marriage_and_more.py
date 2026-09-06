"""Turn the two mobility preferences into lists.

A member who accepts a partner willing to relocate is usually just as happy with
one open to discussing it, and a single choice made them exclude matches they
would have wanted. Every selected value now counts.

The columns are CharField holding "" at this point, and "" is not valid JSON, so
the ALTER trips SQLite's JSON_VALID check. They are normalised to "[]" first -
which is valid JSON and casts cleanly. Both columns are blank on every row (the
fields shipped days ago and no UI ever wrote a value), so nothing is lost.
"""

from django.db import migrations, models

COLUMNS = ["partner_relocate_after_marriage", "partner_settle_abroad"]

def to_json_text(apps, schema_editor):
    """Rewrite each column as valid JSON text before the type changes.

    An existing single answer becomes a one-item list; blank becomes an empty
    list. On this database every row is blank, so the first branch is a
    safeguard rather than a code path anyone will hit.
    """
    Profile = apps.get_model("profiles", "Profile")

    updates = []
    for profile in Profile.objects.all().iterator():
        for column in COLUMNS:
            current = (getattr(profile, column) or "").strip()
            setattr(profile, column, f'["{current}"]' if current else "[]")
        updates.append(profile)

    if updates:
        Profile.objects.bulk_update(updates, COLUMNS, batch_size=500)


def to_blank_text(apps, schema_editor):
    """Back to a single value, keeping the first. Lossy by nature."""
    Profile = apps.get_model("profiles", "Profile")
    updates = []
    for profile in Profile.objects.all().iterator():
        for column in COLUMNS:
            values = getattr(profile, column) or []
            setattr(profile, column, values[0] if values else "")
        updates.append(profile)
    if updates:
        Profile.objects.bulk_update(updates, COLUMNS, batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0024_backfill_managed_by"),
    ]

    operations = [
        # Must run BEFORE the AlterField: SQLite validates the column against
        # JSON_VALID as part of the rebuild, and "" fails it.
        migrations.RunPython(to_json_text, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="profile",
            name="partner_relocate_after_marriage",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name="profile",
            name="partner_settle_abroad",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.RunPython(migrations.RunPython.noop, to_blank_text),
    ]
