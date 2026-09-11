"""Clear the genre tags from Music, Films and Reading.

Those three columns stop holding slug lists ("bollywood", "ghazal") and start
holding named picks - objects with a title, an optional link and the artwork
unfurled from it. The two shapes cannot coexist in one column: everything that
reads them, from the profile view to the generated bio, would have to branch on
the type of every element forever.

Converting a genre into a pick was considered and rejected with the user: a card
reading "Bollywood" with no artwork and no link is not the specific, personal
answer the new question asks for, and leaving it there would make every profile
look half-migrated. So the tags go.

There is no schema change here - JSONField holds either shape - which is also
why the reverse is a no-op rather than a restore. The old values are not
recoverable from this migration, by design.
"""

from django.db import migrations


COLUMNS = ["interests_music", "interests_movies", "interests_books"]


def clear_tags(apps, schema_editor):
    Profile = apps.get_model("profiles", "Profile")
    # .update() rather than a loop of .save(): Profile.save() recomputes
    # completeness and stamps auto_now on updated_at, and a data migration must
    # not make every member look as though they just edited their profile.
    Profile.objects.update(**{column: [] for column in COLUMNS})


def noop(apps, schema_editor):
    """Nothing to undo to. See the module docstring."""


class Migration(migrations.Migration):

    dependencies = [
        ("profiles", "0030_profile_partner_drinking_and_more"),
    ]

    operations = [
        migrations.RunPython(clear_tags, noop),
    ]
