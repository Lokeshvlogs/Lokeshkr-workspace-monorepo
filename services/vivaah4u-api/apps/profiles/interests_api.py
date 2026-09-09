"""Routes for expressing, answering and listing interests.

A separate router from `api.py`, the way catalog is, rather than growing that
file past 400 lines. Every rule lives in `interests.py`; this only maps
outcomes onto status codes.
"""

from typing import Optional

from django.shortcuts import get_object_or_404
from ninja import Router, Schema
from ninja.errors import HttpError

from . import cards, interests
from .auth import active_auth
from .models import Interest, Profile

router = Router(tags=["interests"])

#: One page of an inbox tab.
PAGE_SIZE = 20

TABS = ("received", "sent", "accepted", "declined")


class SendIn(Schema):
    message: str = ""


class DeclineIn(Schema):
    #: Declining with a block also stops them reaching you again.
    block: bool = False


def _me(request) -> Profile:
    return get_object_or_404(Profile, user=request.user)


def _guard(fn, *args, **kwargs):
    """Turn an InterestError into the HTTP error ninja understands."""
    try:
        return fn(*args, **kwargs)
    except interests.InterestError as error:
        raise HttpError(error.status, error.message)


def _row(interest: Interest, me: Profile, request) -> dict:
    """One inbox row: the other person, plus what this interest is doing."""
    outgoing = interest.sender_id == me.pk
    other = interest.receiver if outgoing else interest.sender

    return {
        "id": interest.id,
        "status": interest.status,
        "direction": "sent" if outgoing else "received",
        "created_at": interest.created_at.isoformat(),
        "responded_at": interest.responded_at.isoformat() if interest.responded_at else None,
        "message": interest.message,
        # Only meaningful on a received row; a sender has nothing to have seen.
        "is_new": (not outgoing) and interest.seen_at is None,
        "profile": cards.person_card(other, request, viewer=me),
    }


@router.get("", auth=active_auth)
def list_interests(request, tab: str = "received", limit: int = PAGE_SIZE, offset: int = 0):
    me = _me(request)
    if tab not in TABS:
        raise HttpError(400, "Unknown tab.")

    limit = max(1, min(limit, 50))
    qs = (
        _guard(interests.for_tab, me, tab)
        .select_related("sender", "receiver")
        .prefetch_related("sender__photos", "receiver__photos")
    )
    total = qs.count()
    rows = [_row(i, me, request) for i in qs[offset : offset + limit]]

    return {"results": rows, "total": total, "has_more": offset + limit < total}


@router.get("/counts", auth=active_auth)
def interest_counts(request):
    return interests.counts(_me(request))


@router.post("/mark-seen", auth=active_auth)
def mark_seen(request):
    return {"seen": interests.mark_seen(_me(request))}


@router.post("/send/{profile_id}", auth=active_auth)
def send_interest(request, profile_id: str, data: Optional[SendIn] = None):
    me = _me(request)
    receiver = get_object_or_404(Profile, profile_id=profile_id)

    interest, mutual = _guard(interests.send, me, receiver, (data.message if data else ""))
    return {"id": interest.id, "status": interest.status, "mutual": mutual}


@router.post("/{interest_id}/accept", auth=active_auth)
def accept_interest(request, interest_id: int):
    interest = _guard(interests.accept, interest_id, _me(request))
    return {"id": interest.id, "status": interest.status}


@router.post("/{interest_id}/decline", auth=active_auth)
def decline_interest(request, interest_id: int, data: Optional[DeclineIn] = None):
    interest = _guard(interests.decline, interest_id, _me(request), bool(data and data.block))
    return {"id": interest.id, "status": interest.status}


@router.post("/{interest_id}/withdraw", auth=active_auth)
def withdraw_interest(request, interest_id: int):
    interest = _guard(interests.withdraw, interest_id, _me(request))
    return {"id": interest.id, "status": interest.status}
