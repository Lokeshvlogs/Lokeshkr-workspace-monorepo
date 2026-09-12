"""Mark gender as answered where it was derived at registration.

`0033_seed_identity_ledger` deliberately left gender alone: the column defaults
to "M" and cannot be blank, so there was no way to tell a man from somebody who
never answered, and marking a default as an answer would have locked women out of
correcting it.

That reasoning does not cover a *derived* gender. Registration sets it from
whether the member is looking for a bride or a groom, or from whose profile it
is - an answer inferred from something they did say. Where the stored gender is
exactly what those answers imply, it was derived, and leaving it unrecorded hands
that member two changes where the rule allows one.

Anything that does not match is left untouched, which is the safe direction: an
unrecorded group's first change is free.

The mapping is copied here rather than imported from `apps.auth_api.api`. A
migration that imports live application code breaks the moment that code is
moved or renamed, and this one has to keep replaying from an empty database for
as long as the project exists.
"""

from django.db import migrations


# Mirrors GENDER_BY_PROFILE_FOR / GENDER_BY_LOOKING_FOR in apps/auth_api/api.py
# as they stood when this migration was written.
BY_PROFILE_FOR = {"son": "M", "brother": "M", "daughter": "F", "sister": "F"}
BY_LOOKING_FOR = {"bride": "M", "groom": "F"}


def derived_gender(profile_for: str, looking_for: str) -> str:
    if (profile_for or "") == "self":
        return BY_LOOKING_FOR.get(looking_for or "", "")
    return BY_PROFILE_FOR.get(profile_for or "", "")


def seed(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")

    updated = []
    for profile in Profile.objects.only(
        "id", "identity_edits", "gender", "profile_for", "looking_for"
    ):
        ledger = dict(profile.identity_edits or {})
        if "gender" in ledger:
            continue

        expected = derived_gender(profile.profile_for, profile.looking_for)
        if not expected or expected != profile.gender:
            continue

        ledger["gender"] = {"answered": True, "count": 0, "opened_at": ""}
        profile.identity_edits = ledger
        updated.append(profile)

    if updated:
        # bulk_update, not save(): Profile.save() recomputes completeness and
        # stamps auto_now on updated_at, and nobody edited their profile here.
        Profile.objects.bulk_update(updated, ["identity_edits"], batch_size=500)


def unseed(apps, schema_editor):
    """Remove only the untouched entries this migration could have added."""
    Profile = apps.get_model("profiles", "Profile")

    updated = []
    for profile in Profile.objects.exclude(identity_edits={}).only("id", "identity_edits"):
        ledger = dict(profile.identity_edits or {})
        state = ledger.get("gender")
        if not state or state.get("count") or state.get("opened_at"):
            continue

        ledger.pop("gender")
        profile.identity_edits = ledger
        updated.append(profile)

    if updated:
        Profile.objects.bulk_update(updated, ["identity_edits"], batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0034_split_dob_ledger_key"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
