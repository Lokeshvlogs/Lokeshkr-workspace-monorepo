"""Who is running a profile, and how to say it.

`profile_for` already implies this for its five values, so the registration form
pre-fills from it rather than asking the same question twice. The stored field
exists for the cases those five cannot express - a cousin, a guardian, a friend.

Kept deliberately separate from `derive_gender`. That function decides `gender`,
which `build_profile_id` bakes into the permanent public id, so anything feeding
it can rewrite a member's URL. Nothing here may ever be wired into it.
"""

# What `profile_for` implies about who is managing the profile.
FROM_PROFILE_FOR = {
    "self": "self",
    "son": "parent",
    "daughter": "parent",
    "brother": "sibling",
    "sister": "sibling",
}

# Third-person phrasing, for reading someone else's profile.
LABELS = {
    "self": "Managed by the member",
    "parent": "Managed by their parent",
    "sibling": "Managed by their sibling",
    "relative": "Managed by a relative",
    "guardian": "Managed by their guardian",
    "friend": "Managed by a friend",
}

# First-person phrasing, for your own profile.
OWNER_LABELS = {
    "self": "You manage this profile",
    "parent": "Managed by a parent",
    "sibling": "Managed by a sibling",
    "relative": "Managed by a relative",
    "guardian": "Managed by a guardian",
    "friend": "Managed by a friend",
}


def default_for(profile_for: str) -> str:
    """The obvious answer given who the profile is for. Blank if unknown."""
    return FROM_PROFILE_FOR.get((profile_for or "").strip(), "")


def resolve(managed_by: str, profile_for: str) -> str:
    """The stored value, falling back to what `profile_for` implies.

    Lets every profile created before this field existed still report something
    sensible, without a migration having to guess for the edge cases.
    """
    value = (managed_by or "").strip()
    if value in LABELS:
        return value
    return default_for(profile_for)


def label_for(managed_by: str, profile_for: str, owner: bool = False) -> str:
    """Human phrasing, or "" when we genuinely do not know."""
    value = resolve(managed_by, profile_for)
    if not value:
        return ""
    return (OWNER_LABELS if owner else LABELS)[value]
