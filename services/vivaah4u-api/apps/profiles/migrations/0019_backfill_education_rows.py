"""Turn each profile's single education into the first row of its history.

Without this, everybody's education disappears from the new wizard step the
moment it starts reading the related rows - the three old columns would still
hold the data, just no longer be the thing displayed.

The old `college_university` values are slugs from the hardcoded option list
(`iit_bombay`), which do not match catalog slugs
(`indian_institute_of_technology_bombay_in`). They are resolved by turning the
underscores back into spaces and looking that up against `search_blob`, which
contains the lowercased name and every alias - so "iit bombay" finds IIT Bombay
through its alias.

Anything that does not resolve keeps its name with NO institution link and
`is_other=False`, which makes it invisible to reputation scoring. That is the
honest outcome: we do not know the place, and guessing "low" would penalise a
member for our own incomplete catalog.
"""

from django.db import migrations

NO_REPUTATION = 9
SCHOOL_LEVELS = {"high_school"}


def forwards(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")
    ProfileEducation = apps.get_model("profiles", "ProfileEducation")
    Institution = apps.get_model("catalog", "Institution")

    rows = []
    tier_updates = []

    for profile in Profile.objects.all().iterator():
        if profile.educations.exists():
            continue  # already migrated, or created after this landed

        level = (profile.education_level or "").strip()
        field = (profile.field_of_study or "").strip()
        college = (profile.college_university or "").strip()

        if not level and not field and not college:
            continue

        institution = None
        name = ""
        country = ""

        if college and college != "other_college":
            needle = college.replace("_", " ").strip().lower()
            institution = (
                Institution.objects.filter(search_blob__contains=needle).first()
                if needle
                else None
            )
            if institution is not None:
                name = institution.name
                country = institution.country
            else:
                # Best-effort readable name from the old slug.
                name = college.replace("_", " ").title()

        rows.append(
            ProfileEducation(
                profile=profile,
                position=0,
                level=level,
                field_of_study=field,
                country=country,
                institution=institution,
                institution_name=name,
                institution_country=country,
                # Never `is_other`: an unresolved legacy value is unknown, not
                # a claim, so it must not be scored as one.
                is_other=False,
                reputation_claimed=False,
                completion_year=None,
            )
        )

        if institution is not None and level not in SCHOOL_LEVELS:
            profile.education_reputation_tier = institution.reputation_tier
            tier_updates.append(profile)

    if rows:
        ProfileEducation.objects.bulk_create(rows, batch_size=500)
    if tier_updates:
        Profile.objects.bulk_update(
            tier_updates, ["education_reputation_tier"], batch_size=500
        )


def backwards(apps, schema_editor):
    """Drop the rows. The three Profile columns were never cleared, so the
    original data is still there and nothing is lost."""
    ProfileEducation = apps.get_model("profiles", "ProfileEducation")
    ProfileEducation.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0018_profile_achievements_and_more"),
        ("catalog", "0002_employer_profession_blob"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
