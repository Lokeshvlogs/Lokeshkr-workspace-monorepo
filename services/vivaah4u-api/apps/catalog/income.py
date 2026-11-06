"""Annual-income brackets, per country of residence.

A constant rather than a table, for the same reasons as `visa.py`: the list is
small, it changes with editorial judgement rather than with user data, and it
belongs in version control where a change is reviewable. Served through the
catalog API so the client never hard-codes it.

THE SLUG IS A TIER, NOT AN AMOUNT. The nine values below are the ones profiles
have always stored ("0-5" ... "500+"), and every currency maps the same nine
onto money that makes sense where it is earned - tier "25-50" is 25-50 lacs in
India and $75-150k in the United States. That is deliberate:

  * nothing has to migrate, because no stored value changes;
  * `matching.EXACT_COLUMNS["salary"]` keeps filtering with a plain
    `annual_income__in`, so one filter pick matches the same tier in every
    currency rather than silently excluding everyone paid in dollars;
  * the profile hero's income tag keeps round-tripping into
    `/matches?salary=<slug>`.

Only labels are safe to reword. Adding a currency means adding a row to
BRACKETS and pointing countries at it in COUNTRY_CURRENCY - never renumbering
the tiers.
"""

#: The nine tiers, in order. Every currency's label list matches this exactly.
TIERS = ("0-5", "5-10", "10-15", "15-25", "25-50", "50-100", "100-200", "200-500", "500+")

#: ISO-2 country -> currency. Anything unlisted falls back to DEFAULT_CURRENCY.
COUNTRY_CURRENCY = {
    "IN": "INR",
    "US": "USD",
    "CA": "CAD",
    "GB": "GBP",
    "AE": "AED",
    "SA": "SAR",
    "QA": "QAR",
    "KW": "KWD",
    "OM": "OMR",
    "BH": "BHD",
    "AU": "AUD",
    "NZ": "NZD",
    "SG": "SGD",
    "MY": "MYR",
    "HK": "HKD",
    "JP": "JPY",
    "CH": "CHF",
    "ZA": "ZAR",
    "LK": "LKR",
    "NP": "NPR",
    "BD": "BDT",
    "PK": "PKR",
    # The euro, spelled out per country so a lookup never needs a second table.
    "DE": "EUR", "FR": "EUR", "IT": "EUR", "ES": "EUR", "NL": "EUR",
    "BE": "EUR", "AT": "EUR", "IE": "EUR", "PT": "EUR", "FI": "EUR",
    "GR": "EUR", "LU": "EUR",
}

#: A member whose country is not listed above. INR rather than USD: this is an
#: Indian matrimony product, so an unmapped country is far more likely to be a
#: gap in the table than a member genuinely earning in dollars.
DEFAULT_CURRENCY = "INR"


def _tiered(symbol, ranges):
    """Zip the nine tier slugs onto one currency's nine money ranges."""
    assert len(ranges) == len(TIERS), "every currency needs a label per tier"
    return symbol, tuple(zip(TIERS, ranges))


#: currency -> (symbol, ((tier, label), ...)).
BRACKETS = {
    # L and Cr rather than "lacs" and "crores": these labels share a card row
    # with the education beside them, and the words were eating the width that
    # qualification needed. The short forms are how the amounts are written in
    # every Indian salary listing anyway.
    "INR": _tiered("₹", (
        "₹0-5L", "₹5-10L", "₹10-15L", "₹15-25L",
        "₹25-50L", "₹50L-1Cr", "₹1-2Cr",
        "₹2-5Cr", "₹5Cr+",
    )),
    "USD": _tiered("$", (
        "$0-15k", "$15-30k", "$30-45k", "$45-75k", "$75-150k",
        "$150-300k", "$300-600k", "$600k-1.5M", "$1.5M+",
    )),
    "CAD": _tiered("C$", (
        "C$0-20k", "C$20-40k", "C$40-60k", "C$60-100k", "C$100-200k",
        "C$200-400k", "C$400-800k", "C$800k-2M", "C$2M+",
    )),
    "GBP": _tiered("£", (
        "£0-12k", "£12-25k", "£25-35k", "£35-60k", "£60-120k",
        "£120-250k", "£250-500k", "£500k-1.2M", "£1.2M+",
    )),
    "EUR": _tiered("€", (
        "€0-15k", "€15-30k", "€30-45k", "€45-75k", "€75-150k",
        "€150-300k", "€300-600k", "€600k-1.5M", "€1.5M+",
    )),
    "AED": _tiered("AED ", (
        "AED 0-60k", "AED 60-120k", "AED 120-180k", "AED 180-300k", "AED 300-600k",
        "AED 600k-1.2M", "AED 1.2-2.4M", "AED 2.4-6M", "AED 6M+",
    )),
    "SAR": _tiered("SAR ", (
        "SAR 0-60k", "SAR 60-120k", "SAR 120-180k", "SAR 180-300k", "SAR 300-600k",
        "SAR 600k-1.2M", "SAR 1.2-2.4M", "SAR 2.4-6M", "SAR 6M+",
    )),
    "QAR": _tiered("QAR ", (
        "QAR 0-60k", "QAR 60-120k", "QAR 120-180k", "QAR 180-300k", "QAR 300-600k",
        "QAR 600k-1.2M", "QAR 1.2-2.4M", "QAR 2.4-6M", "QAR 6M+",
    )),
    "KWD": _tiered("KD ", (
        "KD 0-5k", "KD 5-10k", "KD 10-15k", "KD 15-25k", "KD 25-50k",
        "KD 50-100k", "KD 100-200k", "KD 200-500k", "KD 500k+",
    )),
    "OMR": _tiered("OMR ", (
        "OMR 0-6k", "OMR 6-12k", "OMR 12-18k", "OMR 18-30k", "OMR 30-60k",
        "OMR 60-120k", "OMR 120-240k", "OMR 240-600k", "OMR 600k+",
    )),
    "BHD": _tiered("BD ", (
        "BD 0-6k", "BD 6-12k", "BD 12-18k", "BD 18-30k", "BD 30-60k",
        "BD 60-120k", "BD 120-240k", "BD 240-600k", "BD 600k+",
    )),
    "AUD": _tiered("A$", (
        "A$0-25k", "A$25-45k", "A$45-70k", "A$70-110k", "A$110-220k",
        "A$220-450k", "A$450-900k", "A$900k-2.2M", "A$2.2M+",
    )),
    "NZD": _tiered("NZ$", (
        "NZ$0-25k", "NZ$25-45k", "NZ$45-70k", "NZ$70-110k", "NZ$110-220k",
        "NZ$220-450k", "NZ$450-900k", "NZ$900k-2.2M", "NZ$2.2M+",
    )),
    "SGD": _tiered("S$", (
        "S$0-25k", "S$25-45k", "S$45-70k", "S$70-120k", "S$120-240k",
        "S$240-480k", "S$480k-1M", "S$1-2.5M", "S$2.5M+",
    )),
    "MYR": _tiered("RM", (
        "RM0-40k", "RM40-80k", "RM80-120k", "RM120-200k", "RM200-400k",
        "RM400-800k", "RM800k-1.6M", "RM1.6-4M", "RM4M+",
    )),
    "HKD": _tiered("HK$", (
        "HK$0-150k", "HK$150-300k", "HK$300-450k", "HK$450-750k", "HK$750k-1.5M",
        "HK$1.5-3M", "HK$3-6M", "HK$6-15M", "HK$15M+",
    )),
    "JPY": _tiered("¥", (
        "¥0-2M", "¥2-4M", "¥4-6M", "¥6-10M", "¥10-20M",
        "¥20-40M", "¥40-80M", "¥80-200M", "¥200M+",
    )),
    "CHF": _tiered("CHF ", (
        "CHF 0-40k", "CHF 40-70k", "CHF 70-100k", "CHF 100-150k", "CHF 150-300k",
        "CHF 300-600k", "CHF 600k-1.2M", "CHF 1.2-3M", "CHF 3M+",
    )),
    "ZAR": _tiered("R", (
        "R0-200k", "R200-400k", "R400-600k", "R600k-1M", "R1-2M",
        "R2-4M", "R4-8M", "R8-20M", "R20M+",
    )),
    "LKR": _tiered("Rs ", (
        "Rs 0-1.5M", "Rs 1.5-3M", "Rs 3-4.5M", "Rs 4.5-7.5M", "Rs 7.5-15M",
        "Rs 15-30M", "Rs 30-60M", "Rs 60-150M", "Rs 150M+",
    )),
    "NPR": _tiered("NRs ", (
        "NRs 0-8L", "NRs 8-16L", "NRs 16-24L", "NRs 24-40L",
        "NRs 40-80L", "NRs 80L-1.6Cr", "NRs 1.6-3.2Cr",
        "NRs 3.2-8Cr", "NRs 8Cr+",
    )),
    "BDT": _tiered("৳", (
        "৳0-6L", "৳6-12L", "৳12-18L", "৳18-30L",
        "৳30-60L", "৳60L-1.2Cr", "৳1.2-2.4Cr",
        "৳2.4-6Cr", "৳6Cr+",
    )),
    "PKR": _tiered("Rs ", (
        "Rs 0-15L", "Rs 15-30L", "Rs 30-45L", "Rs 45-75L",
        "Rs 75L-1.5Cr", "Rs 1.5-3Cr", "Rs 3-6Cr",
        "Rs 6-15Cr", "Rs 15Cr+",
    )),
}


def currency_for(country: str) -> str:
    """The currency a member in `country` is offered. Never blank."""
    return COUNTRY_CURRENCY.get((country or "").upper(), DEFAULT_CURRENCY)


def symbol_for(currency: str) -> str:
    """The sign to print in front of an amount."""
    entry = BRACKETS.get((currency or "").upper())
    return entry[0] if entry else BRACKETS[DEFAULT_CURRENCY][0]


def _pairs_for(currency: str):
    entry = BRACKETS.get((currency or "").upper())
    return entry[1] if entry else BRACKETS[DEFAULT_CURRENCY][1]


def options_for(country: str) -> list[dict]:
    """Income brackets for a country, as `{value, label}` pairs."""
    return [
        {"value": value, "label": label}
        for value, label in _pairs_for(currency_for(country))
    ]


def is_valid(value: str) -> bool:
    """Whether `value` is one of the nine tiers. Blank counts as unanswered.

    Not scoped to a country, unlike `visa.is_valid`: the tiers are the same
    everywhere and only the labels differ, which is the whole point of them.
    """
    return not value or value in TIERS


def label_for(currency: str, value: str) -> str:
    """The display label for one tier in one currency.

    Falls back to the raw slug rather than to a blank, for the same reason
    `visa.label_for` falls back to the generic list: a member who moves country
    keeps their stored tier until they re-answer, so a value can outlive the
    currency it was picked in, and something recognisable beats nothing.
    """
    if not value:
        return ""
    for tier, label in _pairs_for(currency):
        if tier == value:
            return label
    return value
