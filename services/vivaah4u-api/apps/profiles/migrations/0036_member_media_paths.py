"""Point the three image fields at one folder per member.

Schema only: `upload_to` decides where the NEXT file is written and says nothing
about the rows already stored, so this migration moves nothing and is safe to
apply while the old layout is still on disk. Both layouts serve side by side,
because the column holds the full MEDIA_ROOT-relative path.

Relocating the existing files is a separate, resumable step that deliberately
does not live in a migration - see
`apps/profiles/management/commands/reorganise_media.py`.
"""

import apps.profiles.media_paths
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0035_seed_gender_ledger'),
    ]

    operations = [
        migrations.AlterField(
            model_name='familymember',
            name='photo',
            field=models.ImageField(blank=True, null=True, upload_to=apps.profiles.media_paths.family_path),
        ),
        migrations.AlterField(
            model_name='profile',
            name='display_picture',
            field=models.ImageField(blank=True, null=True, upload_to=apps.profiles.media_paths.dp_path),
        ),
        migrations.AlterField(
            model_name='profilephoto',
            name='image',
            field=models.ImageField(upload_to=apps.profiles.media_paths.gallery_path),
        ),
    ]
