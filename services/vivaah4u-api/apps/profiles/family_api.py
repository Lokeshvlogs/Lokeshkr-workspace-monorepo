"""The people behind the family counts, and their photos.

A router of its own, the way interests are, rather than growing `api.py`.
Reading someone else's family goes through the same visibility rules their
profile does - a hidden profile's family is hidden with it.
"""

from typing import List, Optional

from django.shortcuts import get_object_or_404
from ninja import File, Router, Schema
from ninja.errors import HttpError
from ninja.files import UploadedFile

from .auth import active_auth, optional_auth
from .models import FamilyMember, Profile

router = Router(tags=["family"])

MAX_PHOTO_BYTES = 5 * 1024 * 1024


class MemberIn(Schema):
    relation: str
    name: str = ""
    occupation: str = ""
    about: str = ""
    is_married: bool = False
    position: int = 0


def _me(request) -> Profile:
    return get_object_or_404(Profile, user=request.user)


def _out(member: FamilyMember, request) -> dict:
    photo = None
    if member.photo:
        try:
            photo = request.build_absolute_uri(member.photo.url)
        except (ValueError, AttributeError):
            photo = None

    return {
        "id": member.id,
        "relation": member.relation,
        "relation_label": member.get_relation_display(),
        "name": member.name,
        "occupation": member.occupation,
        "about": member.about,
        "is_married": member.is_married,
        "photo": photo,
        # Sent rather than derived on the client so the graph's layout and the
        # model's idea of who is older cannot drift apart.
        "generation": member.generation,
        "position": member.position,
    }


def _validate_relation(relation: str) -> str:
    if relation not in FamilyMember.Relation.values:
        raise HttpError(400, "Unknown relation.")
    return relation


@router.get("/me", auth=active_auth)
def my_family(request):
    profile = _me(request)
    return {"results": [_out(m, request) for m in profile.family_members.all()]}


@router.post("/me", auth=active_auth)
def add_member(request, data: MemberIn):
    profile = _me(request)

    if profile.family_members.count() >= FamilyMember.MAX_PER_PROFILE:
        raise HttpError(409, f"A family can hold {FamilyMember.MAX_PER_PROFILE} people here.")

    member = FamilyMember.objects.create(
        profile=profile,
        relation=_validate_relation(data.relation),
        name=data.name.strip(),
        occupation=data.occupation.strip(),
        about=data.about.strip(),
        is_married=data.is_married,
        position=data.position,
    )
    return _out(member, request)


def _owned(request, member_id: int) -> FamilyMember:
    """Yours, or a 404 - never a 403, which would confirm the row exists."""
    member = FamilyMember.objects.filter(pk=member_id, profile__user=request.user).first()
    if member is None:
        raise HttpError(404, "Family member not found.")
    return member


@router.patch("/me/{member_id}", auth=active_auth)
def update_member(request, member_id: int, data: MemberIn):
    member = _owned(request, member_id)

    member.relation = _validate_relation(data.relation)
    member.name = data.name.strip()
    member.occupation = data.occupation.strip()
    member.about = data.about.strip()
    member.is_married = data.is_married
    member.position = data.position
    member.save()

    return _out(member, request)


@router.delete("/me/{member_id}", auth=active_auth)
def remove_member(request, member_id: int):
    _owned(request, member_id).delete()
    return {"removed": True}


@router.post("/me/{member_id}/photo", auth=active_auth)
def upload_member_photo(request, member_id: int, file: UploadedFile = File(...)):
    member = _owned(request, member_id)

    content_type = getattr(file, "content_type", "")
    if not content_type or not content_type.startswith("image/"):
        raise HttpError(400, "Uploaded file must be an image")
    if file.size > MAX_PHOTO_BYTES:
        raise HttpError(400, "Image size must be <= 5MB")

    member.photo.save(file.name, file, save=True)
    return _out(member, request)


@router.get("/{profile_id}", auth=optional_auth)
def public_family(request, profile_id: str):
    """Somebody else's family.

    Behind the same visibility rules as their profile: hiding a profile hides
    the family with it, and a 404 rather than a 403 so a hidden profile cannot
    be confirmed to exist.
    """
    profile = get_object_or_404(Profile, profile_id=profile_id)
    if profile.hide or profile.hide_profile_from_search:
        raise HttpError(404, "Profile not found")

    return {"results": [_out(m, request) for m in profile.family_members.all()]}
