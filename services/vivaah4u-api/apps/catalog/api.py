"""Typeahead over the institution and employer catalogs.

Two rules hold this together:

1. **Reputation shapes the ordering and is never in the response.** It is the
   product's own judgement, and a member who could read it would know exactly
   which answer scores best. The out-schemas below are explicit for that reason -
   `from_orm` on the model would leak every column added later.

2. **Authenticated.** The underlying facts are public, but the curation is not,
   and an open endpoint is an invitation to scrape the whole table.
"""

from django.db.models import BooleanField, Case, Q, Value, When
from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth

from .models import Employer, Institution
from .visa import options_for as visa_options_for

router = Router(tags=["catalog"])

# Kept small: this feeds a dropdown, not a data export.
MAX_LIMIT = 50
DEFAULT_LIMIT = 20
# Below this a query is too broad to narrow anything, so we show the most-used
# entries for the country instead of the alphabetical head of the whole table.
MIN_QUERY_LENGTH = 2


class CatalogItemOut(Schema):
    """Exactly what a client may see. No reputation, no domains, no counts."""

    slug: str
    name: str
    country: str
    city: str = ""
    kind: str = ""


class CatalogPageOut(Schema):
    results: list[CatalogItemOut]
    next_cursor: int | None = None
    has_more: bool = False


class VisaOptionOut(Schema):
    value: str
    label: str


def _search(queryset, q: str, limit: int, cursor: int):
    """Rank, page and trim a catalog queryset.

    Ordering: exact prefix matches first (typing "Del" should surface "Delhi
    University" before "New Delhi Institute"), then reputation, then how many
    members already picked it, then alphabetically for a stable tail.
    """
    q = (q or "").strip().lower()

    if len(q) >= MIN_QUERY_LENGTH:
        queryset = queryset.filter(Q(search_blob__icontains=q))
        queryset = queryset.annotate(
            starts_with=Case(
                When(search_blob__startswith=q, then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            )
        ).order_by("-starts_with", "reputation_tier", "-profile_count", "name")
    else:
        queryset = queryset.order_by("reputation_tier", "-profile_count", "name")

    limit = max(1, min(limit, MAX_LIMIT))
    cursor = max(0, cursor)

    # One extra row is the cheapest way to know whether another page exists.
    window = list(queryset[cursor : cursor + limit + 1])
    has_more = len(window) > limit
    return window[:limit], (cursor + limit if has_more else None), has_more


@router.get("/institutions", response=CatalogPageOut, auth=JWTAuth())
def institutions(
    request,
    q: str = "",
    country: str = "",
    kind: str = "",
    limit: int = DEFAULT_LIMIT,
    cursor: int = 0,
):
    queryset = Institution.objects.filter(is_active=True)
    if country:
        queryset = queryset.filter(country=country.upper())
    if kind:
        queryset = queryset.filter(kind=kind)

    results, next_cursor, has_more = _search(queryset, q, limit, cursor)
    return {"results": results, "next_cursor": next_cursor, "has_more": has_more}


@router.get("/employers", response=CatalogPageOut, auth=JWTAuth())
def employers(
    request,
    q: str = "",
    country: str = "",
    profession: str = "",
    limit: int = DEFAULT_LIMIT,
    cursor: int = 0,
):
    queryset = Employer.objects.filter(is_active=True)
    if country:
        queryset = queryset.filter(country=country.upper())
    if profession:
        # An empty tag list means "offered for every profession", so those must
        # not be filtered out by a profession that simply is not listed.
        #
        # Matched against the delimited blob rather than the JSON column:
        # SQLite has no JSON containment lookup, and the pipes stop "doctor"
        # matching "doctorate".
        needle = f"|{profession.strip().lower()}|"
        queryset = queryset.filter(
            Q(profession_blob__contains=needle) | Q(profession_blob="")
        )

    results, next_cursor, has_more = _search(queryset, q, limit, cursor)
    return {"results": results, "next_cursor": next_cursor, "has_more": has_more}


@router.get("/visa-statuses", response=list[VisaOptionOut], auth=JWTAuth())
def visa_statuses(request, country: str = ""):
    """Residency statuses worth distinguishing in the given country."""
    return visa_options_for(country)
