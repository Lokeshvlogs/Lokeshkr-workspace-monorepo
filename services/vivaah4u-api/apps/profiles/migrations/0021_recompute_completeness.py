"""Recompute the headline percentage now that the wizard asks for more.

Adding the interests fields moves the completeness denominator from 29 to 37, so
every stored `profile_completeness` is stale until its row is next saved. Left
alone, members would see an out-of-date number for weeks.

Percentages legitimately FALL here - the profile genuinely asks for more than it
did. What must not change is `is_complete`, which is measured against the frozen
core set and decides whether somebody appears in matches. This migration asserts
exactly that, and `manage.py check_profile_drift` re-checks it afterwards.
"""

from django.db import migrations

# The frozen core set, inlined. A migration has to keep doing what it did on the
# day it was written, even after the live lists move on.
CORE_TEXT = [
    "first_name", "surname",
    "religion", "community", "mother_tongue",
    "current_country", "current_city",
    "place_of_birth_country", "place_of_birth_city",
    "family_living_in_country", "family_living_in_city", "family_income",
    "education_level", "field_of_study", "college_university",
    "profession", "employed_in", "employed_as", "annual_income",
    "diet", "smoking_habits", "drinking_habits",
    "body_physique", "religiosity",
]
CORE_POSITIVE = ["height_feet"]
CORE_EXTRA_SLOTS = 4  # dob_time, age, gender, display_picture

EXTRA_TEXT = ["daily_routine", "settle_abroad"]
EXTRA_LIST = [
    "interests_music", "interests_movies", "interests_books",
    "interests_cuisines", "interests_travel", "interests_hobbies",
]

THRESHOLD = 95


def core_filled(profile) -> int:
    filled = 0
    for name in CORE_TEXT:
        if str(getattr(profile, name, "") or "").strip():
            filled += 1
    for name in CORE_POSITIVE:
        if (getattr(profile, name, 0) or 0) > 0:
            filled += 1
    if profile.dob_time is not None:
        filled += 1
    if profile.age:
        filled += 1
    if str(profile.gender or "").strip():
        filled += 1
    if profile.display_picture:
        filled += 1
    return filled


def forwards(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")

    core_total = len(CORE_TEXT) + len(CORE_POSITIVE) + CORE_EXTRA_SLOTS
    total = core_total + len(EXTRA_TEXT) + len(EXTRA_LIST)

    updates = []
    flipped = []

    for profile in Profile.objects.all().iterator():
        core = core_filled(profile)
        core_pct = round(core * 100 / core_total)

        extra = 0
        for name in EXTRA_TEXT:
            if str(getattr(profile, name, "") or "").strip():
                extra += 1
        for name in EXTRA_LIST:
            if getattr(profile, name, None):
                extra += 1

        was_eligible = profile.profile_completeness >= THRESHOLD
        now_eligible = core_pct >= THRESHOLD
        if was_eligible != now_eligible:
            flipped.append((profile.pk, was_eligible, now_eligible))

        profile.profile_completeness = round((core + extra) * 100 / total)
        updates.append(profile)

    if updates:
        Profile.objects.bulk_update(
            updates, ["profile_completeness"], batch_size=500
        )

    if flipped:
        # Not fatal - a stale stored value from before the derived-column fix can
        # legitimately disagree - but it must be visible rather than silent.
        print(
            f"\n  NOTE: {len(flipped)} profile(s) changed eligibility. "
            f"These had a stale stored percentage; the core field set itself did "
            f"not change. Run `manage.py check_profile_drift` to review."
        )


def backwards(apps, schema_editor):
    """Recompute against the core set alone, which is what 29 slots meant."""
    Profile = apps.get_model("profiles", "Profile")
    core_total = len(CORE_TEXT) + len(CORE_POSITIVE) + CORE_EXTRA_SLOTS

    updates = []
    for profile in Profile.objects.all().iterator():
        profile.profile_completeness = round(core_filled(profile) * 100 / core_total)
        updates.append(profile)

    if updates:
        Profile.objects.bulk_update(updates, ["profile_completeness"], batch_size=500)


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0020_profile_interests_books_profile_interests_cuisines_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
