from datetime import timedelta
from typing import List

from django.db import transaction
from django.db.models import Case, Count, IntegerField, Max, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from . import cards, interests, presence
from .auth import active_auth, optional_auth
from .mapping import apply_payload, profile_to_api
from .models import Profile, ProfileView
from .schemas import ProfileUpdateSchema

router = Router(tags=["profiles"])

# Window for the "recent activity" figures on the member dashboard.
STATS_WINDOW_DAYS = 30
# How many recent visitors the dashboard shows.
VISITOR_LIMIT = 8
# basics, social, career, family, lifestyle, partner preference, photos.
WIZARD_STEPS = 7
LAST_WIZARD_STEP = WIZARD_STEPS - 1
# How many matches one page carries.
MATCH_PAGE_SIZE = 12
MATCH_TABS = ("all", "new", "recent")
# What counts as "recently joined".
RECENTLY_JOINED_DAYS = 30
# Used when a member has never marked their matches seen - see
# new_match_queryset for why this is not the epoch.
NEW_MATCH_FALLBACK_DAYS = 7


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

    # Blocking is mutual in effect, so a block removes the pair from each
    # other's pool - and from the dashboard count, which reads the same pool.
    blocked = interests.blocked_profile_ids(profile)
    if blocked:
        qs = qs.exclude(pk__in=blocked)

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


@router.get("/profiles", auth=active_auth)
def profiles_list(request):
    qs = (
        Profile.objects.exclude(user=request.user)
        .exclude(hide=True)
        .exclude(hide_profile_from_search=True)
        # profile_to_api reads profile.photos per row.
        .prefetch_related("photos")
    )
    return [profile_to_api(p, request, public=True) for p in qs]


@router.get("/me", auth=active_auth)
def my_profile(request):
    profile = get_object_or_404(Profile, user=request.user)
    data = profile_to_api(profile, request)
    data["is_complete"] = profile.is_complete
    return data


# Optional auth, not none: the page is genuinely public, but a signed-in
# viewer is shown presence and an anonymous one is not.
@router.get("/public/{profile_id}", auth=optional_auth)
def public_profile(request, profile_id: str):
    """Publicly viewable subset of a profile - no contact details, no exact DOB."""
    profile = get_object_or_404(Profile, profile_id=profile_id)
    if profile.hide or profile.hide_profile_from_search:
        raise HttpError(404, "Profile not found")

    viewer = request.auth if getattr(request, "auth", False) else None
    data = profile_to_api(profile, request, public=True, viewer=viewer)
    if profile.hide_display_picture_from_search:
        data["photo"] = None
    return data


def recent_match_queryset(profile: Profile):
    """Members who joined inside the window, newest first."""
    since = timezone.now() - timedelta(days=RECENTLY_JOINED_DAYS)
    return eligible_matches(profile).filter(created_at__gte=since).order_by("-created_at")


def new_match_queryset(profile: Profile):
    """Members who joined since this member last looked at their matches.

    A null marker falls back to a week rather than to the epoch. Treating null
    as "everything" would mark the entire pool as new on a member's first load
    and produce a badge reading in the hundreds, which means nothing.
    """
    marker = profile.last_seen_matches_at or (timezone.now() - timedelta(days=NEW_MATCH_FALLBACK_DAYS))
    return eligible_matches(profile).filter(created_at__gt=marker).order_by("-created_at")


def match_queryset(profile: Profile, tab: str):
    if tab == "recent":
        return recent_match_queryset(profile)
    if tab == "new":
        return new_match_queryset(profile)
    # Verification outranks completeness deliberately. Under today's rule the
    # two agree, so this costs nothing now - but it is what we want the day
    # identity checks decouple them, when an ID-verified 96% profile should
    # beat an unverified 100% one.
    return eligible_matches(profile).order_by(
        "-verification_level", "-profile_completeness", "-created_at"
    )


@router.get("/matches", auth=active_auth)
def matches(request, tab: str = "all", limit: int = MATCH_PAGE_SIZE, offset: int = 0):
    """Suggested matches.

    Placeholder ranking: opposite gender, visible profiles, most complete first.
    A real compatibility algorithm replaces the ordering here later.
    """
    profile = get_object_or_404(Profile, user=request.user)
    if tab not in MATCH_TABS:
        raise HttpError(400, "Unknown tab.")

    limit = max(1, min(limit, 48))
    # profile_to_api reads profile.photos per row.
    qs = match_queryset(profile, tab).prefetch_related("photos")
    total = qs.count()
    rows = [
        profile_to_api(p, request, public=True, viewer=profile)
        for p in qs[offset : offset + limit]
    ]

    return {"results": rows, "total": total, "has_more": offset + limit < total}


TRENDING_TABS = ("trending", "online", "new")
#: What counts as "right now" for the trending rail.
TRENDING_WINDOW_DAYS = 7
TRENDING_LIMIT = 12


def trending_queryset(profile: Profile, tab: str):
    """The rail of profiles worth looking at right now.

    Every one of these is a real signal read off rows that already exist - no
    editorial list, no invented "featured" flag. A rail that quietly promotes
    whoever we like is the thing members learn to ignore.
    """
    pool = eligible_matches(profile)

    if tab == "online":
        cutoff = timezone.now() - presence.ONLINE_WINDOW
        return pool.filter(last_active_at__gte=cutoff).order_by("-last_active_at")

    if tab == "new":
        since = timezone.now() - timedelta(days=TRENDING_WINDOW_DAYS)
        return pool.filter(created_at__gte=since).order_by("-created_at")

    # Most looked at over the window. `.order_by()` clears ProfileView's own
    # Meta ordering, which Django would otherwise fold into the GROUP BY and
    # return one row per view instead of one per profile.
    since = timezone.now() - timedelta(days=TRENDING_WINDOW_DAYS)
    counts = dict(
        ProfileView.objects.filter(created_at__gte=since, viewed__in=pool)
        .order_by()
        .values("viewed")
        .annotate(n=Count("id"))
        .values_list("viewed", "n")
    )
    if not counts:
        return pool.none()

    ranked = sorted(counts.items(), key=lambda pair: -pair[1])[:TRENDING_LIMIT]
    ids = [pk for pk, _ in ranked]

    # Preserve the ranking the database cannot express through `pk__in`.
    order = Case(*[When(pk=pk, then=Value(i)) for i, pk in enumerate(ids)], output_field=IntegerField())
    return pool.filter(pk__in=ids).order_by(order)


@router.get("/trending", auth=active_auth)
def trending(request, tab: str = "trending"):
    """A short rail of profiles, by whichever signal was asked for."""
    profile = get_object_or_404(Profile, user=request.user)
    if tab not in TRENDING_TABS:
        raise HttpError(400, "Unknown tab.")

    qs = trending_queryset(profile, tab).prefetch_related("photos")[:TRENDING_LIMIT]
    return {"results": [profile_to_api(p, request, public=True, viewer=profile) for p in qs]}


@router.post("/matches/seen", auth=active_auth)
def mark_matches_seen(request):
    """Move the "new matches" marker to now.

    Explicit, never a side effect of the GET: a StrictMode double-render, a
    prefetch or a background refetch would otherwise wipe the badge before the
    member had seen anything.
    """
    profile = get_object_or_404(Profile, user=request.user)
    now = timezone.now()
    # .update() so this cannot recompute completeness or bump updated_at.
    Profile.objects.filter(pk=profile.pk).update(last_seen_matches_at=now)
    return {"seen_at": now.isoformat()}


@router.post("/view/{profile_id}", auth=active_auth)
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


def visitor_rows(profile: Profile, repeat_only: bool = False):
    """One row per viewer, with how many times they came back.

    `.order_by()` with no arguments is load-bearing. `ProfileView.Meta.ordering`
    is `["-created_at"]`, and Django folds any active ordering column into the
    GROUP BY - without clearing it this groups by (viewer, created_at) and
    returns one row per view instead of one per viewer. It fails silently, with
    numbers that look plausible.
    """
    rows = (
        ProfileView.objects.filter(viewed=profile)
        .exclude(viewer__hide=True)
        .exclude(viewer__hide_profile_from_search=True)
        .order_by()
        .values("viewer")
        .annotate(visits=Count("id"), last_seen=Max("created_at"))
    )
    if repeat_only:
        rows = rows.filter(visits__gte=2)
    return rows.order_by("-last_seen")


@router.get("/visitors", auth=active_auth)
def profile_visitors(request, filter: str = ""):
    """Who looked at your profile, most recent first, one row per person.

    Aggregated in the database rather than de-duplicated in Python. The old
    version pulled 160 rows and kept the first per viewer, so one enthusiastic
    viewer with 160 visits returned a single visitor and starved out everybody
    else.
    """
    profile = get_object_or_404(Profile, user=request.user)

    rows = list(visitor_rows(profile, repeat_only=filter == "repeat")[:VISITOR_LIMIT])
    by_id = Profile.objects.filter(pk__in=[r["viewer"] for r in rows]).prefetch_related(
        "photos"
    ).in_bulk()

    cards_out = []
    for row in rows:
        viewer = by_id.get(row["viewer"])
        if viewer is None:
            continue
        card = cards.person_card(viewer, request, row["last_seen"], viewer=profile)
        card["visits"] = row["visits"]
        card["is_repeat"] = row["visits"] >= 2
        cards_out.append(card)

    return cards_out


@router.get("/stats", auth=active_auth)
def profile_stats(request):
    """Headline figures for the member dashboard.

    Every number here is counted from real rows - nothing is estimated - so an
    empty account correctly reads as zeros rather than inventing activity.
    """
    profile = get_object_or_404(Profile, user=request.user)
    since = timezone.now() - timedelta(days=STATS_WINDOW_DAYS)

    recent = ProfileView.objects.filter(viewed=profile, created_at__gte=since)
    unique_visitors = recent.values("viewer").aggregate(n=Count("viewer", distinct=True))["n"]

    # Same `.order_by()` caveat as visitor_rows - see the note there.
    repeat_visitors = (
        recent.order_by().values("viewer").annotate(n=Count("id")).filter(n__gte=2).count()
    )

    interest_counts = interests.counts(profile)

    return {
        "window_days": STATS_WINDOW_DAYS,
        "profile_views": recent.count(),
        "unique_visitors": unique_visitors or 0,
        "repeat_visitors": repeat_visitors,
        "views_made": ProfileView.objects.filter(viewer=profile, created_at__gte=since).count(),
        "matches": eligible_matches(profile).count(),
        "new_matches": new_match_queryset(profile).count(),
        "recently_joined": recent_match_queryset(profile).count(),
        "interests_received": interest_counts["received_pending"],
        "interests_unseen": interest_counts["received_unseen"],
        "interests_accepted": interest_counts["accepted"],
        "interests_sent": interest_counts["sent_pending"],
        "interests_declined": interest_counts["declined"],
        "completeness": profile.profile_completeness,
        "photos": profile.photos.count() + (1 if profile.display_picture else 0),
    }


@router.patch("/save-step", auth=active_auth)
def update_profile_step(request, data: ProfileUpdateSchema):
    payload = data.dict(exclude_unset=True)
    step = payload.pop("step", None)

    # The wizard now runs 0..6 (basics, social, career, family, lifestyle,
    # partner preference, photos).
    if step not in range(0, WIZARD_STEPS):
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

        # Saving the last step is what finishing the wizard means. Stamped once
        # and never cleared: it turns off the first-run reveal, and a later edit
        # that drops a field must not put somebody back through it.
        if step == LAST_WIZARD_STEP and profile.registered_at is None:
            profile.registered_at = timezone.now()

        # Profile.save() recomputes completeness and mints profile_id when possible.
        profile.save()

    return {
        "success": True,
        "step": step,
        "profile_id": profile.profile_id or "",
        "profile_completeness": profile.profile_completeness,
        "is_complete": profile.is_complete,
        "registered_at": profile.registered_at.isoformat() if profile.registered_at else None,
    }


@router.post("/me/photo", auth=active_auth)
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
