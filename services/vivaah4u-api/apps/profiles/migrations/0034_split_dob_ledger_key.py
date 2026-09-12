"""Rename the `dob` ledger key to `dob_date`.

Date of birth and time of birth were one group with one allowance. They are two
now, with different limits: a wrong birth *year* is a single mistake worth one
correction, while a birth *time* is routinely guessed, added later for horoscope
matching, and then corrected once somebody checks the certificate.

`0033_seed_identity_ledger` and every save since wrote the old `dob` key, which
no group reads any more. Left alone it would be dead weight in the JSON and,
worse, would silently hand everybody a fresh allowance on their birth date.

`dob_time` is deliberately not created here. An unrecorded group counts as
unanswered, so its first change is free - the safe direction to be wrong in,
and the same reasoning that kept gender out of the 0033 backfill.
"""

from django.db import migrations


def split(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")

    updated = []
    for profile in Profile.objects.exclude(identity_edits={}).only("id", "identity_edits"):
        ledger = dict(profile.identity_edits or {})
        if "dob" not in ledger:
            continue

        # setdefault, not assignment: if a newer save already wrote dob_date,
        # that count is the accurate one and must not be overwritten.
        ledger.setdefault("dob_date", ledger["dob"])
        ledger.pop("dob")

        profile.identity_edits = ledger
        updated.append(profile)

    if updated:
        # bulk_update, not save(): Profile.save() recomputes completeness and
        # stamps auto_now on updated_at, and nobody edited their profile here.
        Profile.objects.bulk_update(updated, ["identity_edits"], batch_size=500)


def unsplit(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")

    updated = []
    for profile in Profile.objects.exclude(identity_edits={}).only("id", "identity_edits"):
        ledger = dict(profile.identity_edits or {})
        if "dob_date" not in ledger:
            continue

        ledger.setdefault("dob", ledger["dob_date"])
        ledger.pop("dob_date")
        # The old single group covered both, so a time-of-birth count has
        # nowhere to go back to and is dropped.
        ledger.pop("dob_time", None)

        profile.identity_edits = ledger
        updated.append(profile)

    if updated:
        Profile.objects.bulk_update(updated, ["identity_edits"], batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0033_seed_identity_ledger"),
    ]

    operations = [
        migrations.RunPython(split, unsplit),
    ]
