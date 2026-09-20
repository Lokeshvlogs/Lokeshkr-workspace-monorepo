"""Routes for privately saving and unsaving profiles.

Its own router, the way interests are, rather than another handful of paths in
`api.py`. There is no domain module beside it because there is no domain: a
save has no rules to enforce past "not yourself", so the model's constraints
are the whole policy and these handlers only map them onto status codes.
"""

from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError

from .auth import active_auth
from .models import Profile, SavedProfile

router = Router(tags=["saved"])


def _me(request) -> Profile:
    return get_object_or_404(Profile, user=request.user)


@router.get("/ids", auth=active_auth)
def saved_ids(request):
    """Every profile_id the caller has saved.

    Ids rather than cards: the match grid already has the profiles it is
    drawing and only needs to know which of them are saved. Returning rows here
    would mean fetching every saved member a second time to paint a bookmark.
    """
    ids = (
        SavedProfile.objects.filter(owner=_me(request))
        .values_list("saved__profile_id", flat=True)
    )
    return {"ids": [pid for pid in ids if pid]}


@router.post("/{profile_id}", auth=active_auth)
def save_profile(request, profile_id: str):
    me = _me(request)
    target = get_object_or_404(Profile, profile_id=profile_id)

    if target.pk == me.pk:
        raise HttpError(400, "You cannot save your own profile.")

    try:
        SavedProfile.objects.get_or_create(owner=me, saved=target)
    except IntegrityError:
        # A double-tap racing itself. The row the other request wrote is the
        # one we wanted, so this is a success, not a conflict.
        pass

    return {"saved": True}


@router.delete("/{profile_id}", auth=active_auth)
def unsave_profile(request, profile_id: str):
    target = get_object_or_404(Profile, profile_id=profile_id)
    # Idempotent: unsaving something that was never saved is the state the
    # caller asked for, so it is not an error.
    SavedProfile.objects.filter(owner=_me(request), saved=target).delete()
    return {"saved": False}
