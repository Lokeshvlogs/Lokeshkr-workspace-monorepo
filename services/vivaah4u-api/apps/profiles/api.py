from typing import List

from django.shortcuts import get_object_or_404
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from ninja_jwt.authentication import JWTAuth

from .mapping import apply_payload, profile_to_api
from .models import Profile
from .schemas import ProfileUpdateSchema

router = Router(tags=["profiles"])

# A profile below this is still considered "in setup" and is bounced back into
# the registration wizard after login.
PROFILE_COMPLETE_THRESHOLD = 95


def validate_sibling_counts(profile: Profile) -> None:
    """You cannot have more married siblings than siblings.

    Checked against the merged profile rather than the incoming payload: a step
    patch may raise `brothers_married` while leaving `brothers` untouched, and
    that pair is only invalid once combined with what is already stored.
    """
    for total_field, married_field, noun in (
        ("brothers", "brothers_married", "brothers"),
        ("sisters", "sisters_married", "sisters"),
    ):
        total = getattr(profile, total_field, 0) or 0
        married = getattr(profile, married_field, 0) or 0
        if married > total:
            raise HttpError(
                400,
                f"Married {noun} ({married}) cannot exceed the number of {noun} ({total}).",
            )


@router.get("/profiles", auth=JWTAuth())
def profiles_list(request):
    qs = Profile.objects.exclude(user=request.user).exclude(hide=True).exclude(
        hide_profile_from_search=True
    )
    return [profile_to_api(p, request, public=True) for p in qs]


@router.get("/me", auth=JWTAuth())
def my_profile(request):
    profile = get_object_or_404(Profile, user=request.user)
    data = profile_to_api(profile, request)
    data["is_complete"] = profile.profile_completeness >= PROFILE_COMPLETE_THRESHOLD
    return data


@router.get("/public/{profile_id}")
def public_profile(request, profile_id: str):
    """Publicly viewable subset of a profile - no contact details, no exact DOB."""
    profile = get_object_or_404(Profile, profile_id=profile_id)
    if profile.hide or profile.hide_profile_from_search:
        raise HttpError(404, "Profile not found")

    data = profile_to_api(profile, request, public=True)
    if profile.hide_display_picture_from_search:
        data["photo"] = None
    return data


@router.get("/matches", auth=JWTAuth())
def matches(request):
    """Suggested matches.

    Placeholder ranking: opposite gender, visible profiles, most complete first.
    A real compatibility algorithm replaces the ordering here later.
    """
    profile = get_object_or_404(Profile, user=request.user)
    opposite = {"M": "F", "F": "M"}.get(profile.gender)

    qs = Profile.objects.exclude(user=request.user).exclude(hide=True).exclude(
        hide_profile_from_search=True
    )
    if opposite:
        qs = qs.filter(gender=opposite)
    qs = qs.order_by("-profile_completeness", "-created_at")[:12]

    return [profile_to_api(p, request, public=True) for p in qs]


@router.patch("/save-step", auth=JWTAuth())
def update_profile_step(request, data: ProfileUpdateSchema):
    payload = data.dict(exclude_unset=True)
    step = payload.pop("step", None)

    # The wizard now runs 0..6 (basics, social, career, family, lifestyle,
    # partner preference, photos).
    if step not in range(0, 7):
        raise HttpError(400, "Invalid step value")

    profile = get_object_or_404(Profile, user=request.user)
    apply_payload(profile, payload)
    validate_sibling_counts(profile)
    # Profile.save() recomputes completeness and mints profile_id when possible.
    profile.save()

    return {
        "success": True,
        "step": step,
        "profile_id": profile.profile_id or "",
        "profile_completeness": profile.profile_completeness,
        "is_complete": profile.profile_completeness >= PROFILE_COMPLETE_THRESHOLD,
    }


@router.post("/me/photo", auth=JWTAuth())
def upload_profile_photo(request, file: UploadedFile = File(...)):
    """Upload or replace the authenticated user's profile photo.

    Validates image content type and size (max 5MB), saves to `display_picture`.
    """
    profile = get_object_or_404(Profile, user=request.user)

    content_type = getattr(file, "content_type", "")
    if not content_type or not content_type.startswith("image/"):
        raise HttpError(400, "Uploaded file must be an image")

    max_size = 5 * 1024 * 1024  # 5 MB
    if file.size > max_size:
        raise HttpError(400, "Image size must be <= 5MB")

    profile.display_picture.save(file.name, file, save=True)

    try:
        photo_url = request.build_absolute_uri(profile.display_picture.url)
    except ValueError:
        photo_url = profile.display_picture.url

    return {
        "display_picture": photo_url,
        "profile_completeness": profile.profile_completeness,
    }
