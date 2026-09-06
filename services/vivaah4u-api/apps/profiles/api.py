from datetime import timedelta
from typing import List

from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from ninja_jwt.authentication import JWTAuth

from .mapping import apply_payload, profile_to_api
from .models import Profile, ProfileView
from .schemas import ProfileUpdateSchema

router = Router(tags=["profiles"])

# Window for the "recent activity" figures on the member dashboard.
STATS_WINDOW_DAYS = 30
# How many recent visitors the dashboard shows.
VISITOR_LIMIT = 8


def eligible_matches(profile: Profile):
    """The pool a member is matched against - shared by /matches and /stats.

    Kept in one place so the dashboard's "matches" figure can never disagree
    with the number of cards actually rendered.
    """
    opposite = {"M": "F", "F": "M"}.get(profile.gender)
    qs = Profile.objects.exclude(user=profile.user).exclude(hide=True).exclude(
        hide_profile_from_search=True
    )
    if opposite:
        qs = qs.filter(gender=opposite)
    return qs


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
    qs = (
        Profile.objects.exclude(user=request.user)
        .exclude(hide=True)
        .exclude(hide_profile_from_search=True)
        # profile_to_api reads profile.photos per row.
        .prefetch_related("photos")
    )
    return [profile_to_api(p, request, public=True) for p in qs]


@router.get("/me", auth=JWTAuth())
def my_profile(request):
    profile = get_object_or_404(Profile, user=request.user)
    data = profile_to_api(profile, request)
    data["is_complete"] = profile.is_complete
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
    qs = (
        eligible_matches(profile)
        # profile_to_api reads profile.photos per row.
        .prefetch_related("photos")
        # Verification outranks completeness deliberately. Under today's rule
        # the two agree, so this costs nothing now - but it is what we want the
        # day identity checks decouple them, when an ID-verified 96% profile
        # should beat an unverified 100% one.
        .order_by("-verification_level", "-profile_completeness", "-created_at")[:12]
    )

    return [profile_to_api(p, request, public=True) for p in qs]


def visitor_card(profile: Profile, request, last_seen) -> dict:
    """The trimmed shape the dashboard's visitor list needs."""
    photo = None
    if profile.display_picture and not profile.hide_display_picture_from_search:
        try:
            photo = request.build_absolute_uri(profile.display_picture.url)
        except ValueError:
            photo = None
    return {
        "profile_id": profile.profile_id or "",
        "verification_level": profile.verification_level,
        "first_name": profile.first_name,
        "surname": profile.surname,
        "age": profile.age,
        "city": profile.current_city,
        "photo": photo,
        "last_seen": last_seen.isoformat() if last_seen else None,
    }


@router.post("/view/{profile_id}", auth=JWTAuth())
def record_profile_view(request, profile_id: str):
    """Log that the caller opened someone else's profile.

    Separate from GET /public/{id} so that endpoint stays genuinely public and
    unauthenticated. Self-views are ignored - your own visits are not activity.
    """
    viewer = get_object_or_404(Profile, user=request.user)
    viewed = get_object_or_404(Profile, profile_id=profile_id)

    if viewer.pk == viewed.pk:
        return {"recorded": False}

    ProfileView.objects.create(viewer=viewer, viewed=viewed)
    return {"recorded": True}


@router.get("/visitors", auth=JWTAuth())
def profile_visitors(request):
    """Who looked at your profile, most recent first, one row per person."""
    profile = get_object_or_404(Profile, user=request.user)

    seen: dict[int, object] = {}
    # Ordered newest-first by Meta.ordering, so the first row per viewer is
    # their latest visit.
    views = (
        ProfileView.objects.filter(viewed=profile)
        .exclude(viewer__hide=True)
        .exclude(viewer__hide_profile_from_search=True)
        .select_related("viewer")
        .prefetch_related("viewer__photos")[: VISITOR_LIMIT * 20]
    )
    for view in views:
        if view.viewer_id not in seen:
            seen[view.viewer_id] = (view.viewer, view.created_at)
        if len(seen) >= VISITOR_LIMIT:
            break

    return [visitor_card(p, request, when) for p, when in seen.values()]


@router.get("/stats", auth=JWTAuth())
def profile_stats(request):
    """Headline figures for the member dashboard.

    Every number here is counted from real rows - nothing is estimated - so an
    empty account correctly reads as zeros rather than inventing activity.
    """
    profile = get_object_or_404(Profile, user=request.user)
    since = timezone.now() - timedelta(days=STATS_WINDOW_DAYS)

    recent = ProfileView.objects.filter(viewed=profile, created_at__gte=since)
    unique_visitors = recent.values("viewer").aggregate(n=Count("viewer", distinct=True))["n"]

    return {
        "window_days": STATS_WINDOW_DAYS,
        "profile_views": recent.count(),
        "unique_visitors": unique_visitors or 0,
        "views_made": ProfileView.objects.filter(viewer=profile, created_at__gte=since).count(),
        "matches": eligible_matches(profile).count(),
        "completeness": profile.profile_completeness,
        "photos": profile.photos.count() + (1 if profile.display_picture else 0),
    }


@router.patch("/save-step", auth=JWTAuth())
def update_profile_step(request, data: ProfileUpdateSchema):
    payload = data.dict(exclude_unset=True)
    step = payload.pop("step", None)

    # The wizard now runs 0..6 (basics, social, career, family, lifestyle,
    # partner preference, photos).
    if step not in range(0, 7):
        raise HttpError(400, "Invalid step value")

    profile = get_object_or_404(Profile, user=request.user)

    # One step already writes the profile row and its gallery, and will soon
    # write related education rows too. Without a transaction a validation
    # failure part-way leaves the photos committed and the rest rolled back.
    with transaction.atomic():
        try:
            apply_payload(profile, payload)
        except ValueError as exc:
            # apply_payload raises this for a payload whose shape is wrong
            # (e.g. an object where a list belongs). Silently coercing it is
            # what produced the current class of write bugs.
            raise HttpError(400, str(exc)) from exc
        validate_sibling_counts(profile)
        # Profile.save() recomputes completeness and mints profile_id when possible.
        profile.save()

    return {
        "success": True,
        "step": step,
        "profile_id": profile.profile_id or "",
        "profile_completeness": profile.profile_completeness,
        "is_complete": profile.is_complete,
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
