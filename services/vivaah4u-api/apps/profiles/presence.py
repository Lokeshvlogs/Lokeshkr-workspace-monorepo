"""Whether a member is around right now.

Driven by a single `last_active_at` column stamped on authenticated API
activity - no sockets, no heartbeat endpoint, nothing to keep alive. The
tradeoff is resolution: someone reading a profile without calling anything
looks idle. That is acceptable for the one thing this drives, which is a dot
and a "last seen" line.
"""

from datetime import timedelta

from django.db import DatabaseError
from django.utils import timezone

from .models import Profile

#: Active within this window reads as "online now".
ONLINE_WINDOW = timedelta(minutes=5)

#: At most one write per member per interval, however many requests they make.
STAMP_INTERVAL = timedelta(minutes=1)


def touch(user) -> None:
    """Record that `user` is currently using the product.

    Three things here are load-bearing:

    - `.update()`, never `profile.save()`. `Profile.save()` recomputes
      completeness and the verification level on every call; running that on
      every API request would be absurd.
    - `.update()` also skips `auto_now`, so `updated_at` is left alone. That
      matters - `updated_at` is on the `/me` payload, and bumping it on every
      page load would invalidate every client's view of the profile.
    - The throttle is the WHERE clause rather than a read-then-write, so this
      is one conditional UPDATE with no SELECT, and it stays correct across
      worker processes.
    """
    if user is None:
        return

    now = timezone.now()
    try:
        Profile.objects.filter(user_id=user.id).exclude(
            last_active_at__gte=now - STAMP_INTERVAL
        ).update(last_active_at=now)
    except DatabaseError:
        # Presence is decoration. It must never turn a working request into a
        # 500 for the member trying to use the product.
        pass


def is_online(last_active_at) -> bool:
    return last_active_at is not None and timezone.now() - last_active_at <= ONLINE_WINDOW


def to_api(last_active_at, *, exact: bool) -> dict | None:
    """The presence block for a serialised profile, or None when unknown.

    `exact` is for a member looking at their own profile. Everywhere else the
    timestamp is floored to the hour: minute-resolution activity on someone
    else's profile is a usage log, and reconstructing one by polling is not
    something to leave open on a matrimonial product.

    A null column returns None rather than "offline" - every profile that
    predates this field has never been stamped, and calling them offline would
    be a claim we cannot support.
    """
    if last_active_at is None:
        return None

    online = is_online(last_active_at)
    stamp = last_active_at if exact else last_active_at.replace(minute=0, second=0, microsecond=0)

    return {
        "isOnline": online,
        # Online members report the window, not the instant - "online now" is
        # the whole message, and the exact minute adds nothing but exposure.
        "lastActiveAt": None if (online and not exact) else stamp.isoformat(),
    }
