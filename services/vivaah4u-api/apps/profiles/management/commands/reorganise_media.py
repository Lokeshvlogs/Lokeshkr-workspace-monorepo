"""Move every stored image into its owner's folder.

    manage.py reorganise_media           # report only, moves nothing
    manage.py reorganise_media --yes     # actually move

Brings rows written under the old flat layout (`profile_pics/`,
`profile_photos/`, `family_photos/`) into the per-member layout that
`apps.profiles.media_paths` now decides for new uploads. Run it after applying
migration 0036; nothing breaks in between, because the column holds the full
MEDIA_ROOT-relative path and both layouts serve side by side.

It is row-driven, so it only ever touches files a row points at. Unreferenced
files are `sweep_media`'s job, and there are usually plenty - run that first and
this report stays small.

**A random basename is carried over unchanged.** Only the directory moves. That
is not cosmetic: `sync_gallery` re-identifies a member's existing photos from
the URLs the client sends back, and preserving the basename is what lets a
client holding a pre-move URL still match. A name that is *not* one of ours -
`Kavish.jpeg`, left over from when uploads were saved under the client's
filename - is replaced with a minted one, since leaving a relative's name in a
public URL is the thing this layout is meant to stop.

**Copy, update, then unlink - in that order.** Moving a file and rewriting its
row cannot be one atomic act, so the order is chosen to hold one invariant:

    no row ever points at a file that is not on disk.

Crash after the copy and the row still names the surviving original. Crash after
the update and the row names the new file, which exists. Either way the leftover
is an orphan that `sweep_media` reclaims, and re-running resumes cleanly. Each
row is its own transaction; a single transaction around the whole run would roll
back fifty rows whose files had already moved, which is the exact drift being
avoided.

Re-running is also how files under `pending-<pk>/` reach their permanent home
once a member finally gets a `profile_id` (see `media_paths.member_dir`), which
is why the admin's "Recompute & repair" action is a reason to run this again.
"""

import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.profiles.media_paths import (
    BUCKET_DP,
    BUCKET_FAMILY,
    BUCKET_PHOTOS,
    MEMBERS_ROOT,
    is_minted_name,
    member_path,
    uuid_name_for,
)
from apps.profiles.models import FamilyMember, Profile, ProfilePhoto

#: (model, field name, bucket, how to reach the owning Profile).
#: The accessor is spelled out because on ProfilePhoto and FamilyMember the
#: attribute `profile_id` is the FK integer, not the member id.
SOURCES = (
    (Profile, "display_picture", BUCKET_DP, lambda row: row),
    (ProfilePhoto, "image", BUCKET_PHOTOS, lambda row: row.profile),
    (FamilyMember, "photo", BUCKET_FAMILY, lambda row: row.profile),
)

LEGACY_DIRS = ("profile_pics", "profile_photos", "family_photos")


class Command(BaseCommand):
    help = "Move stored images into one folder per member."

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Actually move files. Without it the command only reports.",
        )

    def handle(self, *args, **options):
        root = Path(settings.MEDIA_ROOT)
        apply = options["yes"]
        tally = {"moved": 0, "in place": 0, "repaired": 0, "renamed": 0}
        missing = []

        for model, field, bucket, owner_of in SOURCES:
            for row in self._rows(model, field):
                current = getattr(row, field).name
                if not current:
                    continue

                owner = owner_of(row)
                # A name we did not mint does not deserve to be carried over.
                basename = Path(current).name
                if is_minted_name(basename):
                    target = member_path(owner, bucket, basename)
                else:
                    target = member_path(owner, bucket, uuid_name_for(basename))
                    tally["renamed"] += 1

                if current == target:
                    tally["in place"] += 1
                    continue

                source_path = root / current
                if not source_path.exists():
                    # An interrupted run may already have copied this one across
                    # under its computed name; if so the row is all that is left
                    # to fix. Otherwise the row points at nothing and we leave it
                    # alone rather than inventing a path for it.
                    landed = self._already_there(root, owner, bucket, basename)
                    if landed:
                        tally["repaired"] += 1
                        if apply:
                            model.objects.filter(pk=row.pk).update(**{field: landed})
                    else:
                        missing.append(f"{model._meta.label} #{row.pk}: {current}")
                    continue

                tally["moved"] += 1
                if apply:
                    self._relocate(model, row.pk, field, root, source_path, target)

        self._report(tally, missing, apply)

        if apply:
            pruned = _prune_empty_dirs(root)
            if pruned:
                self.stdout.write(f"Pruned {pruned} empty directory(ies).")

        return None

    def _rows(self, model, field):
        rows = model.objects.exclude(**{field: ""}).exclude(**{f"{field}__isnull": True})
        if model is not Profile:
            rows = rows.select_related("profile")
        return rows.iterator()

    def _already_there(self, root, owner, bucket, basename):
        """The relative path a previous run would have written, if it exists."""
        candidate = member_path(owner, bucket, basename)
        return candidate if (root / candidate).exists() else None

    def _relocate(self, model, pk, field, root, source_path, target):
        target_path = _free_path(root / target)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        # copy2 keeps mtime, so the new tree still says when a photo was added.
        shutil.copy2(source_path, target_path)
        stored = target_path.relative_to(root).as_posix()

        with transaction.atomic():
            # .update(), never .save(): Profile.save() recomputes completeness
            # and stamps updated_at, and moving a file must not make a member
            # look like they just edited their profile.
            model.objects.filter(pk=pk).update(**{field: stored})

        source_path.unlink()

    def _report(self, tally, missing, apply):
        verb = "Moved" if apply else "Would move"
        self.stdout.write(f"{verb} {tally['moved']} file(s).")
        self.stdout.write(f"Already in the right place: {tally['in place']}.")
        if tally["renamed"]:
            self.stdout.write(
                f"Of those, {tally['renamed']} carried a client-supplied name and "
                "were given a minted one instead."
            )
        if tally["repaired"]:
            self.stdout.write(
                f"Rows pointing at an already-relocated file, fixed without copying: "
                f"{tally['repaired']}."
            )
        if missing:
            self.stdout.write(
                self.style.WARNING(
                    f"\n{len(missing)} row(s) point at a file that is not on disk. "
                    "Left untouched:"
                )
            )
            for line in missing[:20]:
                self.stdout.write(f"  {line}")
            if len(missing) > 20:
                self.stdout.write(f"  ... and {len(missing) - 20} more")

        if apply:
            self.stdout.write(self.style.SUCCESS("\nDone."))
        else:
            self.stdout.write(
                self.style.WARNING("\nNothing moved - re-run with --yes to apply.")
            )


def _free_path(path: Path) -> Path:
    """`path`, or the first numbered variant that does not exist.

    Basenames are random, so a collision means something is already sitting
    there; taking a new name is safer than overwriting it.
    """
    if not path.exists():
        return path
    for index in range(1, 1000):
        candidate = path.with_name(f"{path.stem}_{index}{path.suffix}")
        if not candidate.exists():
            return candidate
    raise RuntimeError(f"cannot find a free name for {path}")


def _prune_empty_dirs(root: Path) -> int:
    """Remove directories left empty under the trees this command touches."""
    removed = 0
    for name in (MEMBERS_ROOT, *LEGACY_DIRS):
        base = root / name
        if not base.is_dir():
            continue
        # Deepest first, so a parent is reconsidered after its children go.
        for path in sorted(base.rglob("*"), key=lambda p: len(p.parts), reverse=True):
            if path.is_dir() and not any(path.iterdir()):
                path.rmdir()
                removed += 1
        # The legacy roots themselves should go; members/ stays.
        if name in LEGACY_DIRS and not any(base.iterdir()):
            base.rmdir()
            removed += 1
    return removed
