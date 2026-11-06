"""Routes for blocking and unblocking a member.

Its own router, like saved profiles, rather than more paths in `api.py`. Every
rule lives in `interests.py` beside the pool exclusion and the send gate that
already read `Block` - a block is an interest-shaped decision, and splitting it
from them would let the two drift.

Until now the only way to create a `Block` was to decline a pending interest
with `{"block": true}`, which meant a member could not block anybody who had
not written to them first, and nothing could ever be undone.
"""

from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError

from . import cards, interests
from .auth import active_auth
from .models import Profile

router = Router(tags=["blocks"])


def _me(request) -> Profile:
    return get_object_or_404(Profile, user=request.user)


def _guard(fn, *args, **kwargs):
    """Turn an InterestError into the HTTP error ninja understands."""
    try:
        return fn(*args, **kwargs)
    except interests.InterestError as error:
        raise HttpError(error.status, error.message)


@router.get("", auth=active_auth)
def list_blocks(request):
    """Everyone the caller has blocked. Their own list, never anyone else's."""
    me = _me(request)
    rows = [
        {
            "created_at": row.created_at.isoformat(),
            "profile": cards.person_card(row.blocked, request, viewer=me),
        }
        for row in interests.blocked_by(me)
    ]
    return {"results": rows, "total": len(rows)}


@router.post("/{profile_id}", auth=active_auth)
def block_profile(request, profile_id: str):
    me = _me(request)
    other = get_object_or_404(Profile, profile_id=profile_id)
    _guard(interests.block, me, other)
    return {"blocked": True}


@router.delete("/{profile_id}", auth=active_auth)
def unblock_profile(request, profile_id: str):
    me = _me(request)
    other = get_object_or_404(Profile, profile_id=profile_id)
    # Idempotent: unblocking someone who was never blocked is the state the
    # caller asked for, so it is not an error.
    interests.unblock(me, other)
    return {"blocked": False}
