"""Who counts as living abroad, and what to say about their status.

Two audiences read this module and they must never disagree: the profile page,
which shows an NRI tag, and the match search, which filters on `nri=1`. A tag
that says NRI while the filter excludes that member is the kind of bug nobody
reports and everybody notices, so the predicate and the queryset expression are
written here side by side and pinned together by a parity test.

**The rule.** Where someone lives wins; where they work is the fallback, because
"job abroad, location not filled in" is a common half-finished profile and
"lives in India, works in India" is the overwhelmingly common complete one.

    abroad = current_country or work_country        # both ISO-2
    NRI    = abroad is set and abroad != "IN"

Blank is *unknown*, never NRI. Guessing would put a tag on every profile that
simply has not answered.

**Deliberate looseness.** Strictly this covers NRI, PIO and OCI alike: a
second-generation member born abroad and holding a foreign passport gets the
tag. That is the intent. On this platform "lives abroad" is the thing people
search on, and gating the tag on Indian roots would exclude exactly the members
it is most useful for.
"""

from django.db.models import Case, CharField, F, Q, Value, When

from apps.catalog import visa

#: Everything is measured against this one country.
HOME_COUNTRY = "IN"

#: The one visa value that says nothing as a tag. For a member who already holds
#: a foreign passport the citizenship tag covers it, and for a member living
#: abroad but *working* in India it is the Indian citizenship being described -
#: so "Citizen" on their profile would read as a claim about the wrong country.
UNINFORMATIVE_VISA = "citizen"


def abroad_country(profile) -> str:
    """The country this member's life is actually in, or "" if unstated."""
    return (profile.current_country or profile.work_country or "").strip()


def is_nri(profile) -> bool:
    """Whether this member lives or works outside India."""
    country = abroad_country(profile)
    return bool(country) and country != HOME_COUNTRY


def residency_tag(profile) -> dict | None:
    """The second tag beside NRI: nationality, or residency status, or neither.

    Exactly one of the two, never both. Citizenship is the stronger statement
    and wins whenever it is known and is not Indian.
    """
    citizenship = (profile.citizenship_country or "").strip()

    if citizenship and citizenship != HOME_COUNTRY:
        return {
            "kind": "citizenship",
            "value": citizenship,
            # Labelled by the client, which already maps ISO-2 to a country
            # name for every other country field on the page.
            "label": "",
        }

    status = (profile.visa_status or "").strip()
    if not status or status == UNINFORMATIVE_VISA:
        return None

    label = visa.label_for(profile.work_country, status)
    if not label:
        return None

    return {"kind": "visa", "value": status, "label": label}


# --- The same rule, for a queryset ------------------------------------------

#: `abroad` as the database sees it. Written as a Case rather than Coalesce
#: because the columns are blank-not-null: Coalesce would happily return "".
ABROAD = Case(
    When(~Q(current_country=""), then=F("current_country")),
    default=F("work_country"),
    output_field=CharField(),
)


def annotate_abroad(qs):
    return qs.annotate(_abroad=ABROAD)


def filter_nri(qs, want: bool):
    """Narrow `qs` to members who are (or are not) living abroad."""
    qs = annotate_abroad(qs)
    living_abroad = ~Q(_abroad="") & ~Q(_abroad=HOME_COUNTRY)
    return qs.filter(living_abroad) if want else qs.exclude(living_abroad)
