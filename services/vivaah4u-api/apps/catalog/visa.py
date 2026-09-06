"""Residency status options, per country of work.

A constant rather than a table: the list is small, changes with immigration
policy rather than with user data, and belongs in version control where a change
is reviewable. Served through the catalog API so the client never hard-codes it.

Values are stable slugs; only labels are safe to reword.
"""

# Offered for any country without a specific list, and appended to every
# specific list so nobody is forced into a wrong answer.
GENERIC = [
    ("citizen", "Citizen"),
    ("permanent_resident", "Permanent resident"),
    ("work_visa", "Work visa"),
    ("student_visa", "Student visa"),
    ("dependent_visa", "Dependent visa"),
    ("other", "Other"),
]

# Only the statuses a matrimonial profile realistically needs to distinguish -
# the ones that affect whether someone can stay, work, or sponsor a spouse.
BY_COUNTRY = {
    "US": [
        ("citizen", "US citizen"),
        ("green_card", "Green card (permanent resident)"),
        ("h1b", "H-1B"),
        ("l1", "L-1"),
        ("o1", "O-1"),
        ("tn", "TN"),
        ("f1_opt", "F-1 / OPT"),
        ("h4_ead", "H-4 / dependent"),
        ("other", "Other"),
    ],
    "GB": [
        ("citizen", "British citizen"),
        ("ilr", "Indefinite leave to remain"),
        ("skilled_worker", "Skilled worker visa"),
        ("student_visa", "Student visa"),
        ("dependent_visa", "Dependant visa"),
        ("other", "Other"),
    ],
    "CA": [
        ("citizen", "Canadian citizen"),
        ("permanent_resident", "Permanent resident"),
        ("work_permit", "Work permit"),
        ("study_permit", "Study permit"),
        ("dependent_visa", "Dependent"),
        ("other", "Other"),
    ],
    "AU": [
        ("citizen", "Australian citizen"),
        ("permanent_resident", "Permanent resident"),
        ("skilled_visa", "Skilled / employer-sponsored visa"),
        ("student_visa", "Student visa"),
        ("dependent_visa", "Partner / dependent visa"),
        ("other", "Other"),
    ],
    "AE": [
        ("citizen", "Emirati citizen"),
        ("golden_visa", "Golden visa"),
        ("employment_visa", "Employment visa"),
        ("residence_visa", "Residence visa"),
        ("dependent_visa", "Dependent visa"),
        ("other", "Other"),
    ],
    "SG": [
        ("citizen", "Singapore citizen"),
        ("permanent_resident", "Permanent resident"),
        ("employment_pass", "Employment Pass"),
        ("s_pass", "S Pass"),
        ("dependent_pass", "Dependant's Pass"),
        ("student_visa", "Student pass"),
        ("other", "Other"),
    ],
    "NZ": [
        ("citizen", "New Zealand citizen"),
        ("permanent_resident", "Resident visa"),
        ("work_visa", "Work visa"),
        ("student_visa", "Student visa"),
        ("dependent_visa", "Partner / dependent visa"),
        ("other", "Other"),
    ],
    "IN": [
        ("citizen", "Indian citizen"),
        ("oci", "OCI cardholder"),
        ("pio", "PIO cardholder"),
        ("work_visa", "Employment visa"),
        ("other", "Other"),
    ],
    "DE": [
        ("citizen", "German citizen"),
        ("eu_citizen", "EU citizen"),
        ("permanent_resident", "Permanent residence (Niederlassungserlaubnis)"),
        ("blue_card", "EU Blue Card"),
        ("work_visa", "Work visa"),
        ("student_visa", "Student visa"),
        ("other", "Other"),
    ],
    "IE": [
        ("citizen", "Irish citizen"),
        ("eu_citizen", "EU citizen"),
        ("stamp4", "Stamp 4"),
        ("critical_skills", "Critical Skills permit"),
        ("work_visa", "General work permit"),
        ("student_visa", "Student visa"),
        ("other", "Other"),
    ],
}


def options_for(country: str) -> list[dict]:
    """Visa statuses for a country, as `{value, label}` pairs."""
    pairs = BY_COUNTRY.get((country or "").upper(), GENERIC)
    return [{"value": value, "label": label} for value, label in pairs]


def is_valid(country: str, value: str) -> bool:
    """Whether `value` is offered for `country`. Blank counts as unanswered."""
    if not value:
        return True
    return any(option["value"] == value for option in options_for(country))
