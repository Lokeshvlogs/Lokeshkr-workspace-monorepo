"""How much we actually know about who a member is.

The whole point of this module is that **`compute_level` is the only place the
rule lives**. Every surface - the API payload, the badge, match ordering - reads
`profile.verification_level` and never re-derives it. When document checks land,
this one function changes and nothing else does.

The distinction that matters, and the reason there are two visible badges:

  COMPLETE     the member filled everything in. Certifies diligence, nothing
               more. A fraudster reaches it in ten minutes.
  ID_VERIFIED  a third party confirmed the person exists and matches the name
               on the profile. This is the one that protects anybody.

Conflating those would put a trust mark on the cheapest thing to fake, so
COMPLETE deliberately does not render as the blue tick.
"""

from django.db import models


class VerificationLevel(models.IntegerChoices):
    NONE = 0, "Not verified"
    # Sign-up passcode confirmed. Every member who finished signup has this.
    BASIC = 1, "Contact verified"
    # Everything answered, on top of a confirmed number.
    COMPLETE = 2, "Profile complete"
    # A document check passed. Not reachable yet - nothing sets the flag.
    ID_VERIFIED = 3, "Identity verified"


def compute_level(profile) -> int:
    """The single source of truth for a profile's verification level.

    Ordered most-trusted first, so the strongest evidence a member has always
    wins. `id_document_verified` is unreachable today: no code sets it, and the
    DigiLocker integration that will is deliberately out of scope. The branch
    exists so that turning verification on is a data change, not a code change.
    """
    if profile.id_document_verified:
        return VerificationLevel.ID_VERIFIED

    # A full 100%, not the 95% eligibility bar. `is_complete` tolerates one
    # unanswered field so a nearly-done member still appears in matches; the
    # badge should not be that forgiving. Reads the column rather than
    # recomputing because `save()` refreshes it immediately before calling here.
    if profile.phone_verified and profile.profile_completeness >= 100:
        return VerificationLevel.COMPLETE

    if profile.phone_verified:
        return VerificationLevel.BASIC

    return VerificationLevel.NONE
