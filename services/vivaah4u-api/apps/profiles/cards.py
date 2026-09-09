"""The trimmed profile shape used by every list on the dashboard.

Extracted from the visitors endpoint so the interests inbox renders the same
card. Its keys are a frontend contract - `visitors/route.ts` maps them by name -
so adding to this is safe and renaming is not.
"""

from . import presence
from .models import Profile


def person_card(profile: Profile, request, last_seen=None, viewer: Profile | None = None) -> dict:
    """One member, as a list row.

    `last_seen` is about the row, not the member - the time of the visit or of
    the interest - and is separate from `presence`, which is about whether they
    are around right now.
    """
    photo = None
    if profile.display_picture and not profile.hide_display_picture_from_search:
        try:
            photo = request.build_absolute_uri(profile.display_picture.url)
        except (ValueError, AttributeError):
            photo = None

    card = {
        "profile_id": profile.profile_id or "",
        "verification_level": profile.verification_level,
        "first_name": profile.first_name,
        "surname": profile.surname,
        "age": profile.age,
        "city": profile.current_city,
        "photo": photo,
        "last_seen": last_seen.isoformat() if last_seen else None,
    }

    if viewer is not None:
        card["presence"] = presence.to_api(profile.last_active_at, exact=False)

    return card
