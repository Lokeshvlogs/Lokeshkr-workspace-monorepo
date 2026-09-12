"""Mark the identity groups existing profiles have already answered.

`identity.guard` treats the first value submitted for a group as the answer
rather than as a change, and records that in `identity_edits`. Profiles that
existed before the ledger did have no entry at all, so their next edit would
have read as a first answer and been free - handing everyone already on the
platform three changes instead of two.

Gender is deliberately not seeded. Its column defaults to "M" and cannot be
blank, so there is no way to tell a man from somebody who never answered, and
marking the default as an answer would lock women out of correcting it. Their
first real choice stays free, which is the safe direction to be wrong in.
"""

from django.db import migrations


SEEDED = {
    "name": ("first_name", "surname"),
    "dob": ("dob_time",),
    "height": ("height_feet",),
}


def _answered(profile, columns) -> bool:
    for column in columns:
        value = getattr(profile, column, None)
        if value is None:
            continue
        # 0 is "not set" for height, the same reading the completeness code takes.
        if isinstance(value, int) and not isinstance(value, bool):
            if value > 0:
                return True
            continue
        if str(value).strip():
            return True
    return False


def seed(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")

    updated = []
    for profile in Profile.objects.all().only(
        "id", "identity_edits", "first_name", "surname", "dob_time", "height_feet"
    ):
        ledger = dict(profile.identity_edits or {})
        changed = False

        for group, columns in SEEDED.items():
            if group in ledger or not _answered(profile, columns):
                continue
            # Answered, nothing spent, no window open: exactly where a member
            # who filled the field in today would stand.
            ledger[group] = {"answered": True, "count": 0, "opened_at": ""}
            changed = True

        if changed:
            profile.identity_edits = ledger
            updated.append(profile)

    if updated:
        # bulk_update, not save(): Profile.save() recomputes completeness and
        # stamps auto_now on updated_at, and nobody edited their profile here.
        Profile.objects.bulk_update(updated, ["identity_edits"], batch_size=500)


def unseed(apps, schema_editor):
    """Drop only what this migration added, leaving real counts alone."""
    Profile = apps.get_model("profiles", "Profile")

    updated = []
    for profile in Profile.objects.exclude(identity_edits={}).only("id", "identity_edits"):
        ledger = {
            group: state
            for group, state in (profile.identity_edits or {}).items()
            if not (group in SEEDED and not state.get("count") and not state.get("opened_at"))
        }
        if ledger != (profile.identity_edits or {}):
            profile.identity_edits = ledger
            updated.append(profile)

    if updated:
        Profile.objects.bulk_update(updated, ["identity_edits"], batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0032_identity_edits_and_states"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
