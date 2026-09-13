"""Delete uploaded image files that no surviving row references.

    manage.py sweep_media              # report only, deletes nothing
    manage.py sweep_media --yes        # actually delete

Django has not deleted an `ImageField`'s file when its row goes away since 1.3,
and this service has no `post_delete` or `delete()` override anywhere. So every
deleted Profile, ProfilePhoto or FamilyMember leaves its file on disk.

Deleting is not the only way orphans appear, which is why this is a command in
its own right rather than a step inside `purge_members`: replacing a display
picture points the column at the new file and simply abandons the old one, so
`media/` grows a stale file on every re-upload during entirely normal use.

It matters more here than it would elsewhere, because `MEDIA_URL` is served
unconditionally (`vivaah4you/urls.py:29`, not gated on DEBUG): an orphaned photo
stays publicly fetchable at its old URL long after the account is gone.
"""

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.profiles.models import FamilyMember, Profile, ProfilePhoto

#: The directories this service writes uploads into. Kept as an explicit list
#: rather than walking all of MEDIA_ROOT: a future app's uploads must not be
#: swept by a command that knows nothing about which rows reference them.
#:
#: `members` is the current layout - one folder per member, see
#: `apps.profiles.media_paths`. The three flat directories after it are legacy:
#: nothing writes to them any more, but they stay listed so the orphans already
#: sitting there remain reclaimable, and so anything `reorganise_media` could
#: not move stays visible. Drop them in a follow-up once every environment's
#: directories are gone.
MEDIA_DIRS = ("members", "profile_pics", "profile_photos", "family_photos")


def referenced_names() -> set[str]:
    """Every file path currently pointed at by a row, relative to MEDIA_ROOT."""
    names: set[str] = set()
    for queryset, field in (
        (Profile.objects, "display_picture"),
        (ProfilePhoto.objects, "image"),
        (FamilyMember.objects, "photo"),
    ):
        names.update(
            name
            for name in queryset.values_list(field, flat=True)
            if name
        )
    # Stored with forward slashes; compared against Path parts below.
    return {name.replace("\\", "/") for name in names}


def find_orphans() -> list[Path]:
    """Files under the three upload directories that nothing references."""
    root = Path(settings.MEDIA_ROOT)
    keep = referenced_names()
    orphans = []
    for directory in MEDIA_DIRS:
        base = root / directory
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*")):
            if not path.is_file():
                continue
            relative = path.relative_to(root).as_posix()
            if relative not in keep:
                orphans.append(path)
    return orphans


def sweep(orphans, *, delete: bool) -> int:
    """Remove `orphans` when `delete`; return the number of bytes involved.

    Returns bytes, and keeps doing so: `purge_members` reports the figure it
    gets back from here.

    Directories left empty are pruned as part of the same pass. With one folder
    per member that matters - a purged account used to leave its whole folder
    tree behind, because deleting a file has never removed its parent.
    """
    total = 0
    touched = set()
    for path in orphans:
        total += path.stat().st_size
        if delete:
            path.unlink()
            touched.add(path.parent)

    if delete:
        root = Path(settings.MEDIA_ROOT)
        for directory in touched:
            _prune_upwards(directory, root)

    return total


def _prune_upwards(directory: Path, root: Path) -> None:
    """Remove `directory` and each empty parent, stopping inside MEDIA_ROOT.

    `rmdir` only succeeds on an empty directory, so it is the test as well as
    the action. The walk never reaches MEDIA_ROOT itself or the layout roots
    listed in MEDIA_DIRS - an empty `members/` is the correct state for a fresh
    install, not something to delete.
    """
    keep = {(root / name).resolve() for name in MEDIA_DIRS}
    keep.add(root.resolve())

    current = directory.resolve()
    while current not in keep and root.resolve() in current.parents:
        try:
            current.rmdir()
        except OSError:
            return
        current = current.parent


class Command(BaseCommand):
    help = "Delete uploaded images no surviving row references."

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Actually delete. Without it the command only reports.",
        )

    def handle(self, *args, **options):
        orphans = find_orphans()
        if not orphans:
            self.stdout.write(self.style.SUCCESS("No orphaned media files."))
            return

        for path in orphans[:20]:
            self.stdout.write(f"  {path.relative_to(settings.MEDIA_ROOT).as_posix()}")
        if len(orphans) > 20:
            self.stdout.write(f"  ... and {len(orphans) - 20} more")

        freed = sweep(orphans, delete=options["yes"])
        megabytes = freed / (1024 * 1024)
        if options["yes"]:
            self.stdout.write(
                self.style.SUCCESS(f"\nDeleted {len(orphans)} file(s), {megabytes:.1f} MB.")
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"\n{len(orphans)} orphaned file(s), {megabytes:.1f} MB. "
                    "Nothing deleted - re-run with --yes."
                )
            )
