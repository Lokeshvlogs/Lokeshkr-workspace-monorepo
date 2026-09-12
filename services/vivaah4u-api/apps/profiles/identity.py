"""How often the facts that identify a member may be changed.

Name, date of birth, gender and height are not ordinary profile fields. Two of
them are baked into `profile_id` the moment both are known - see
`Profile.build_profile_id`, where gender and age become part of a public
identifier that is never reissued - and all four are what a family checks a
profile against. A profile whose name and gender can be swapped freely is a
profile that can be quietly repurposed after it has been seen, introduced, or
declined.

So each group gets a short grace period and then stops moving:

  * The first value submitted for a group is free. It has to be - somebody who
    registers today and finishes the wizard next week would otherwise find
    their own name locked before they ever typed it.
  * The first *change* to an answered group opens a 24-hour window.
  * Inside that window the group may be changed up to its own limit.
  * When the window closes the group is permanent, whether or not the whole
    allowance was used.

The limits differ because the fields differ (see `IDENTITY_LIMITS`). The count
and the window are per group, not per column: correcting a first name and a
surname together is one change, because it is one act.

Nothing here is a security boundary on its own - it is a data-integrity rule,
enforced server-side because the wizard, the inline profile editor and any
future client all reach the same `apply_payload`.
"""

from datetime import timedelta

from django.utils import timezone


def _name_of(profile):
    return (profile.first_name or "", profile.surname or "")


def _date_of(profile):
    """The calendar date of birth, plus the age derived from it at signup."""
    stamp = profile.dob_time
    return (stamp.date() if stamp else None, profile.age or 0)


def _time_of(profile):
    """The clock time of birth, which is a separate answer from the date.

    Many members do not know it, add it later for horoscope matching, and then
    correct it once somebody checks the birth certificate - so it is allowed
    more changes than the date, and spending one must not cost the other.
    """
    stamp = profile.dob_time
    return (stamp.time() if stamp else None,)


def _gender_of(profile):
    return (profile.gender or "",)


def _height_of(profile):
    return (profile.height_feet or 0, profile.height_inches or 0)


#: Group -> how to read its value off a profile.
#:
#: Extractors rather than column lists because date and time of birth share one
#: `dob_time` column while being two separate answers with two separate
#: allowances. Comparing extracted values also means the comparison is between
#: coerced types, never between a payload string and a datetime.
IDENTITY_GROUPS = {
    "name": _name_of,
    "dob_date": _date_of,
    "dob_time": _time_of,
    "gender": _gender_of,
    "height": _height_of,
}

#: How many changes each group gets.
#:
#: Gender is one because it is half of `profile_id` and a matrimonial profile
#: that changes gender is a different profile. The date of birth is two: a
#: wrong year is a real mistake worth one correction. Height and time of birth
#: are three - both are commonly guessed first and measured later, and neither
#: identifies anybody on its own.
IDENTITY_LIMITS = {
    "name": 2,
    "dob_date": 2,
    "dob_time": 3,
    "gender": 1,
    "height": 3,
}

#: What each group is called when the refusal is read by a person.
GROUP_LABELS = {
    "name": "name",
    "dob_date": "date of birth",
    "dob_time": "time of birth",
    "gender": "gender",
    "height": "height",
}

IDENTITY_WINDOW = timedelta(hours=24)


class IdentityLocked(ValueError):
    """A change to a field that has run out of changes.

    A ValueError subclass so it travels the path `apply_payload` callers
    already handle - `update_profile_step` turns those into a 400 - while
    staying catchable on its own where the distinction matters.
    """


#: Columns to put back when a change is refused.
#:
#: Every column any extractor reads. Restoring all of them rather than only the
#: offending group's is deliberate: one payload can change several, and leaving
#: the allowed ones applied while refusing one would save half of what was asked
#: for.
GUARDED_COLUMNS = (
    "first_name",
    "surname",
    "dob_time",
    "age",
    "gender",
    "height_feet",
    "height_inches",
)


def snapshot(profile) -> dict:
    """The before-image `guard` compares against.

    Two parts, because they serve different purposes: `values` is per group and
    answers "did this group change", while `columns` is what gets written back
    if the answer turns out to be "yes, and it was not allowed".
    """
    return {
        "values": {group: read(profile) for group, read in IDENTITY_GROUPS.items()},
        "columns": {column: getattr(profile, column, None) for column in GUARDED_COLUMNS},
    }


def _state(profile, group: str) -> dict:
    raw = (profile.identity_edits or {}).get(group) or {}
    return {
        "answered": bool(raw.get("answered")),
        "count": int(raw.get("count") or 0),
        "opened_at": raw.get("opened_at") or "",
    }


def _window_closed(opened_at: str, now) -> bool:
    if not opened_at:
        return False
    parsed = timezone.datetime.fromisoformat(opened_at)
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.utc)
    return now - parsed >= IDENTITY_WINDOW


def lock_state(profile, now=None) -> dict:
    """What each group's remaining allowance looks like, for the client.

    Sent on the owner's own payload, and again from `save-step`, so the wizard
    and the profile editor can warn before a change is made and go inert once
    there are none left - rather than letting somebody retype their name and
    lose it to a 400.
    """
    now = now or timezone.now()
    out = {}

    for group in IDENTITY_GROUPS:
        state = _state(profile, group)
        limit = IDENTITY_LIMITS[group]
        closed = _window_closed(state["opened_at"], now)
        used_up = state["count"] >= limit

        out[group] = {
            # A group nobody has answered yet is always editable: the first
            # answer is free, and until it is given there is nothing to protect.
            "locked": bool(state["answered"] and (closed or used_up)),
            "changesLeft": max(0, limit - state["count"]),
            "limit": limit,
            "windowOpenedAt": state["opened_at"] or None,
            "windowClosed": closed,
        }

    return out


def mark_answered(profile, group: str) -> None:
    """Record that a group already holds its answer, without spending anything.

    For a value the member did not type but did imply - gender, derived at
    registration from whether they are looking for a bride or a groom. `guard`
    charges nothing for the first value submitted for a group, which is right
    for a field somebody fills in themselves and wrong here: it would hand a
    member with a pre-filled gender one free change plus one counted one, where
    the rule allows one in total.

    A no-op when the group already has an entry, so calling it twice cannot
    reset a count.
    """
    if group not in IDENTITY_GROUPS:
        raise KeyError(f"unknown identity group: {group}")

    ledger = dict(profile.identity_edits or {})
    if group in ledger:
        return
    ledger[group] = {"answered": True, "count": 0, "opened_at": ""}
    profile.identity_edits = ledger


def guard(profile, before: dict, now=None) -> None:
    """Allow, record or refuse the identity changes just written to `profile`.

    Runs *after* the payload has been applied rather than before it, so the
    comparison is between two coerced values: "male" has already become "M" and
    a date string has already become a datetime, and a guard that compared raw
    payload values would report a change every time either was re-sent
    unchanged.

    On refusal the whole before-image is restored before raising, so a caller
    holding the instance outside a transaction is not left with a half-applied
    change.
    """
    now = now or timezone.now()
    ledger = dict(profile.identity_edits or {})

    values = before["values"]

    for group, read in IDENTITY_GROUPS.items():
        if read(profile) == values.get(group):
            continue

        state = _state(profile, group)

        # The first value the member submits for a group is the answer, not a
        # change, and costs nothing.
        #
        # Recorded in the ledger rather than inferred from the old value being
        # blank, because `gender` cannot be blank: it defaults to "M", so a
        # woman choosing "female" for the first time looked exactly like
        # somebody changing their mind. A default nobody chose is not an answer.
        if not state["answered"]:
            ledger[group] = {"answered": True, "count": 0, "opened_at": ""}
            continue

        if state["opened_at"] and _window_closed(state["opened_at"], now):
            _restore(profile, before)
            raise IdentityLocked(
                f"Your {GROUP_LABELS[group]} can no longer be changed. "
                f"It was fixed 24 hours after the first change."
            )

        limit = IDENTITY_LIMITS[group]
        if state["count"] >= limit:
            times = "once" if limit == 1 else f"{limit} times"
            _restore(profile, before)
            raise IdentityLocked(
                f"Your {GROUP_LABELS[group]} has already been changed {times} "
                f"and is now fixed."
            )

        ledger[group] = {
            "answered": True,
            "count": state["count"] + 1,
            # The window opens on the first change and never moves again, so a
            # later change cannot extend it.
            "opened_at": state["opened_at"] or now.isoformat(),
        }

    profile.identity_edits = ledger


def _restore(profile, before: dict) -> None:
    for column, value in before["columns"].items():
        setattr(profile, column, value)
