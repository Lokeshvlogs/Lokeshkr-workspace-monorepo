"""Where a member's uploaded images live on disk, and what they are called.

One folder per member, named by their public `profile_id`, with a sub-folder per
kind of image:

    media/members/V4UF28000042/dp/5185a3b5eb09….jpeg
                              /photos/093180b55428….jpeg
                              /family/ff22b0f740a6….jpg

Three rules hold this together.

**The folder is named after the member; the file never is.** `MEDIA_URL` is
served with no authentication (`vivaah4you/urls.py:29`), and `profile_id` is
public - it appears in profile URLs. If the filename were predictable too,
anyone holding a member's id could enumerate their private photos by guessing.

**The name is minted here, not at the call sites.** `upload_to` is consulted on
*every* write - the two upload endpoints, the wizard's base64 path, and the
admin's photo inlines - so generating the random name inside these callables is
what guarantees a client-supplied filename can never reach disk by any route,
including one added later. It is why `media/family_photos/` holds `Kavish.jpeg`
and a pile of `arun_1psNDwn.png` today and will not again.

**These functions take a Profile, never an id.** On `ProfilePhoto` and
`FamilyMember` the attribute `profile_id` is the foreign-key *integer*, not the
member id - a collision that already produced one live bug
(`FamilyMember.__str__` rendered "Father of 15"). Passing the Profile object
explicitly, plus the shape check in `member_dir`, makes that mistake unable to
put a file in `members/7/`.

FROZEN IMPORT PATHS
-------------------
Migration `0036_member_media_paths` serialises `dp_path`, `gallery_path` and
`family_path` by dotted import path. Renaming or moving one breaks `migrate` on
any database that has not yet applied it. If one has to move, leave a shim.
"""

import re
import uuid
from pathlib import PurePosixPath

#: Extensions we are willing to write. Mirrors what the wizard's data-URL
#: decoder accepts, so both paths agree on what an image is.
ALLOWED_EXTENSIONS = {"jpeg", "jpg", "png", "webp", "gif"}

DEFAULT_EXTENSION = "jpg"

#: Everything a member owns lives under this one directory.
MEMBERS_ROOT = "members"

BUCKET_DP = "dp"
BUCKET_PHOTOS = "photos"
BUCKET_FAMILY = "family"

#: What a minted public id looks like - see `Profile.build_profile_id`.
PUBLIC_ID = re.compile(r"\AV4U[A-Z]\d+\Z")


def member_dir(profile) -> str:
    """The folder name for one member.

    `profile_id` is blank until gender *and* age are both known, and stays blank
    for good on a profile whose age is falsy or that was created outside
    `register` (createsuperuser, the admin's add form, a shell). Those are real,
    reachable accounts that can still upload, so the fallback is not defensive
    padding - it is the path some files genuinely take.

    The shape check is the safety net: anything that is not a minted id - an
    integer FK that reached here by mistake, `None`, a blank string - lands in
    `pending-…` rather than inventing a folder that looks public. A minted id
    always starts "V4U", so the two can never collide, and keying the fallback
    on the pk keeps one folder per member even before an id exists.

    Re-running `reorganise_media` after an id is finally assigned is what moves
    those files into their permanent home.
    """
    public_id = getattr(profile, "profile_id", None)
    if isinstance(public_id, str) and PUBLIC_ID.match(public_id):
        return public_id
    return f"pending-{getattr(profile, 'pk', None) or 'unknown'}"


def member_path(profile, bucket: str, filename: str) -> str:
    """MEDIA_ROOT-relative path for one file, keeping the name it is given.

    Deterministic on purpose: `reorganise_media` computes a row's target with
    this, preserving the existing basename so a client holding a pre-move URL
    can still be matched by `sync_gallery`. The `*_path` callables below are the
    ones that mint a new name.
    """
    # Only the basename survives: a client-supplied name may carry directory
    # separators, and "../" in an upload is how you write outside MEDIA_ROOT.
    safe = PurePosixPath(str(filename).replace("\\", "/")).name
    return f"{MEMBERS_ROOT}/{member_dir(profile)}/{bucket}/{safe}"


# --- The three upload_to callables -------------------------------------------
#
# Each mints a fresh random name, so the caller's filename only ever supplies a
# hint about the extension.

def dp_path(instance, filename: str) -> str:
    """`Profile.display_picture` - instance is a Profile."""
    return member_path(instance, BUCKET_DP, uuid_name_for(filename))


def gallery_path(instance, filename: str) -> str:
    """`ProfilePhoto.image` - instance is a ProfilePhoto."""
    return member_path(instance.profile, BUCKET_PHOTOS, uuid_name_for(filename))


def family_path(instance, filename: str) -> str:
    """`FamilyMember.photo` - instance is a FamilyMember."""
    return member_path(instance.profile, BUCKET_FAMILY, uuid_name_for(filename))


# --- Naming ------------------------------------------------------------------

def safe_extension(filename: str = "", content_type: str = "") -> str:
    """Pick an extension we are prepared to serve.

    The client's filename is a hint and nothing more; if it does not carry one
    we recognise, the content type gets a turn, and failing that we fall back to
    a default rather than writing an extensionless file. The allowlist is what
    stops a `.php` or a double extension riding in on an upload.
    """
    suffix = PurePosixPath(str(filename or "")).suffix.lstrip(".").lower()
    if suffix in ALLOWED_EXTENSIONS:
        return suffix

    subtype = (content_type or "").partition("/")[2].lower()
    if subtype in ALLOWED_EXTENSIONS:
        return subtype

    return DEFAULT_EXTENSION


def uuid_name(extension: str) -> str:
    """A random, unguessable basename carrying the given extension."""
    return f"{uuid.uuid4().hex}.{extension.lstrip('.').lower()}"


def uuid_name_for(filename: str = "", content_type: str = "") -> str:
    """`uuid_name` with the extension worked out from an upload."""
    return uuid_name(safe_extension(filename, content_type))


def is_minted_name(filename: str) -> bool:
    """Whether a stored basename is already one of ours.

    `reorganise_media` keeps a random basename when relocating and replaces
    anything else - a name like `Kavish.jpeg`, carried over from when uploads
    were saved under the client's filename.
    """
    stem = PurePosixPath(str(filename or "")).stem
    return bool(re.fullmatch(r"[0-9a-f]{32}|[0-9a-f-]{36}", stem))
