"""Ranking and derivation rules for a member's education history.

A profile has many `ProfileEducation` rows, but the rest of the system - match
filters, the compatibility panel, the card headline, completeness - all expect
one `education_level`. Rather than teach every one of those about a list, the
highest row is written back onto the Profile as a cache. `refresh_derived()` is
the single place that happens.
"""

# Higher is more advanced. Only relative order matters.
#
# `professional` (MBBS, CA, LLB...) ties with a master's rather than sitting
# below it: they are terminal qualifications in their own right, and ranking
# them under a taught master's would misread most doctors' and lawyers' profiles.
EDUCATION_RANK = {
    "": 0,
    "other": 0,
    "high_school": 1,
    "diploma": 2,
    "bachelors": 3,
    "masters": 4,
    "professional": 4,
    "phd": 5,
}

# At or below this, an institution's reputation is not recorded or considered.
# Schooling says little about a person's prospects and a great deal about where
# their parents lived, so scoring it would mostly encode wealth.
RANK_SCHOOL = 1

# No usable signal. Matches ReputationTier.UNRANKED in apps.catalog.
NO_REPUTATION = 9


def rank_of(level: str) -> int:
    return EDUCATION_RANK.get((level or "").strip(), 0)


def is_school_level(level: str) -> bool:
    return 0 < rank_of(level) <= RANK_SCHOOL


def counts_for_reputation(entry) -> bool:
    """Whether an education row may contribute a reputation tier.

    Excluded: school-level rows by policy, and half-filled rows where no
    institution was chosen at all - an empty answer is not a weak signal, it is
    the absence of one.
    """
    if is_school_level(entry.level):
        return False
    return entry.institution_id is not None or entry.is_other


def tier_for(entry) -> int:
    """The reputation tier one education row contributes."""
    if not counts_for_reputation(entry):
        return NO_REPUTATION

    if entry.institution_id is not None:
        return entry.institution.reputation_tier

    # "Other / not listed": the member's own claim, which is unverified by
    # construction. Both outcomes rank below every seeded tier, so a claim can
    # never outrank a real institution - see ReputationTier.
    return 5 if entry.reputation_claimed else 8


def best_entry(entries):
    """The highest qualification, for the derived Profile columns.

    Ties break on `position`, which is the order the member arranged them in -
    so someone with two master's degrees sees the one they listed first.
    """
    ranked = [e for e in entries if rank_of(e.level) > 0]
    if not ranked:
        return None
    return min(ranked, key=lambda e: (-rank_of(e.level), e.position, e.pk or 0))


def best_reputation_tier(entries) -> int:
    """The best (lowest) tier across every row that is allowed to have one."""
    tiers = [tier_for(e) for e in entries if counts_for_reputation(e)]
    return min(tiers) if tiers else NO_REPUTATION
