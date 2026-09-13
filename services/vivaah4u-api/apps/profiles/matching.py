"""Narrowing and ordering the match pool.

Lives apart from `api.py` so the handler stays a handler and the rules are
something tests can drive directly.

**Applied on top of the pool, never inside it.** `eligible_matches` is shared
with `/stats`, and its docstring says why: *"Kept in one place so the
dashboard's 'matches' figure can never disagree with the number of cards
actually rendered."* Filtering in there would quietly change the dashboard's
count to mean "matches under whatever filters the last search used". So the
pool stays the pool, and everything here is layered over it.

**Unanswered is not a mismatch.** A profile with no height recorded survives a
height range, and one with no age survives an age range. They have not failed
the test; they have not taken it. Hiding them would penalise incomplete
profiles, which is the opposite of what search is for.

Two encoding notes that the client half has to agree with:

- Multi-value filters arrive as REPEATED query parameters, not comma-joined
  strings. `city` values contain commas (`"Mumbai, Maharashtra, India"`), so a
  comma encoding would need escaping on both sides.
- `city` matches the whole composed label exactly. It is the same string the
  profile stores and the same one the hero tag copies, so equality is right and
  is indexable; `icontains` would turn it into a scan and let "field" match
  "Springfield".
"""

from typing import List, Optional

from django.db.models import F, IntegerField, Q
from django.db.models.functions import Cast
from ninja import Field, Schema

from . import residency
from .mapping import MARITAL_TO_MODEL


class MatchFilterSchema(Schema):
    """Every way a member may narrow their matches. All optional."""

    q: str = ""

    religion: List[str] = []
    marital_status: List[str] = Field([], alias="maritalStatus")
    country: List[str] = []
    city: List[str] = []
    state: List[str] = []
    mother_tongue: List[str] = Field([], alias="motherTongue")
    community: List[str] = []
    education: List[str] = []
    profession: List[str] = []
    diet: List[str] = []
    salary: List[str] = []
    citizenship: List[str] = []
    visa: List[str] = []

    nri: Optional[bool] = None

    age_min: Optional[int] = Field(None, alias="ageMin")
    age_max: Optional[int] = Field(None, alias="ageMax")
    #: Total inches, matching how partner height preferences are stored.
    height_min: Optional[int] = Field(None, alias="heightMin")
    height_max: Optional[int] = Field(None, alias="heightMax")

    sort: str = "best"


#: filter field -> the column it narrows. Everything here is an exact `__in`,
#: because both sides read the same option lists and so both speak in stored
#: values rather than labels.
EXACT_COLUMNS = {
    "religion": "religion",
    "country": "current_country",
    "city": "current_city",
    "state": "current_state",
    "mother_tongue": "mother_tongue",
    "community": "community",
    "education": "education_level",
    "profession": "profession",
    "diet": "diet",
    "salary": "annual_income",
    "citizenship": "citizenship_country",
    "visa": "visa_status",
}

SORTS = {
    # The pool's own ranking. Verification outranks completeness deliberately -
    # see match_queryset.
    "best": ("-verification_level", "-profile_completeness", "-created_at"),
    "newest": ("-created_at",),
    "age_asc": ("age",),
    "age_desc": ("-age",),
}


def apply_match_filters(qs, f: MatchFilterSchema):
    """Narrow `qs` by everything set on `f`. Unset filters do nothing."""
    for field, column in EXACT_COLUMNS.items():
        values = [v for v in (getattr(f, field) or []) if v]
        if values:
            qs = qs.filter(**{f"{column}__in": values})

    # Marital status is stored as an integer; the client speaks slugs.
    statuses = [
        MARITAL_TO_MODEL[v] for v in (f.marital_status or []) if v in MARITAL_TO_MODEL
    ]
    if statuses:
        qs = qs.filter(marital_status__in=statuses)

    if f.nri is not None:
        qs = residency.filter_nri(qs, f.nri)

    # Ranges. The `| Q(x=0) | Q(x__isnull=True)` half is the "unanswered is not
    # a mismatch" rule, and it is why these are not plain __gte/__lte.
    if f.age_min is not None:
        qs = qs.filter(Q(age__gte=f.age_min) | Q(age=0) | Q(age__isnull=True))
    if f.age_max is not None:
        qs = qs.filter(Q(age__lte=f.age_max) | Q(age=0) | Q(age__isnull=True))

    if f.height_min is not None or f.height_max is not None:
        # Height is stored as a feet/inches pair, so the comparable number has
        # to be built before it can be compared.
        qs = qs.annotate(
            _height_inches=Cast(F("height_feet") * 12 + F("height_inches"), IntegerField())
        )
        if f.height_min is not None:
            qs = qs.filter(Q(_height_inches__gte=f.height_min) | Q(_height_inches=0))
        if f.height_max is not None:
            qs = qs.filter(Q(_height_inches__lte=f.height_max) | Q(_height_inches=0))

    text = (f.q or "").strip()
    if text:
        # The same haystack the browser used to search, moved to where the rows
        # actually are.
        qs = qs.filter(
            Q(first_name__icontains=text)
            | Q(surname__icontains=text)
            | Q(current_city__icontains=text)
            | Q(profession__icontains=text)
            | Q(community__icontains=text)
        )

    return qs


def apply_sort(qs, sort: str, tab: str):
    """Order `qs`, leaving the date-ordered tabs alone.

    `new` and `recent` are defined by recency; re-sorting them by anything else
    would answer a different question from the one the tab asks.
    """
    if tab in ("new", "recent"):
        return qs
    return qs.order_by(*SORTS.get(sort, SORTS["best"]))
