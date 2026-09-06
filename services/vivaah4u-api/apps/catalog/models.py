"""Reference data: institutions and employers members can pick from.

Kept in its own app rather than in `profiles` because it is not member data. It
has its own admin, its own seed command, and it can be re-seeded from public
datasets without ever touching a profile migration.

The reputation tier is the reason this is a table rather than another hand-kept
TypeScript option file: it has to shape match ordering while never being visible
to the client. See `apps.catalog.api` for how that is enforced.
"""

from django.db import models


class ReputationTier(models.IntegerChoices):
    """Lower is better, so ordering is a plain ascending sort.

    The gap between SELF_CLAIMED_HIGH and SELF_CLAIMED_LOW is deliberate: a
    member ticking "well regarded" about an institution we have never heard of
    is a real but weak signal, so it ranks below everything we actually seeded
    and above everything we know nothing about. It must never let an unverified
    claim outrank a genuinely elite institution.
    """

    ELITE = 1, "Elite"                       # IIT/IIM/AIIMS/ISB/NLU, Ivy+, Oxbridge
    STRONG = 2, "Strong"                     # NIRF 26-100, well-known MNCs
    STANDARD = 3, "Standard"                 # recognised / accredited
    BASIC = 4, "Basic"                       # recognised but unranked
    SELF_CLAIMED_HIGH = 5, "Self-claimed high"
    SELF_CLAIMED_LOW = 8, "Self-claimed low"
    UNRANKED = 9, "Unranked"                 # bulk-imported, no ranking signal


class CatalogEntry(models.Model):
    """Fields common to institutions and employers."""

    # Stable identifier the client sends back. Names change spelling; slugs do
    # not, which is what makes re-seeding idempotent.
    slug = models.SlugField(max_length=160, unique=True)
    name = models.CharField(max_length=200)
    # Alternate names people actually type: "IISc", "Indian Institute of Science".
    aliases = models.JSONField(default=list, blank=True)

    country = models.CharField(max_length=2, db_index=True)  # ISO-2
    state = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=120, blank=True)

    # Domains for the later email-OTP verification (a .edu / work address
    # proves affiliation far more cheaply than a document check).
    email_domains = models.JSONField(default=list, blank=True)

    # INTERNAL. Shapes search ordering and match ranking; never serialised.
    reputation_tier = models.PositiveSmallIntegerField(
        choices=ReputationTier.choices,
        default=ReputationTier.UNRANKED,
        db_index=True,
    )
    # Which seed produced the tier. `seed_catalog` refuses to overwrite
    # "curated" from a bulk import, so hand-checked tiers survive a re-seed.
    reputation_source = models.CharField(max_length=30, blank=True)

    is_active = models.BooleanField(default=True)
    # How many profiles reference this. Refreshed by a periodic command rather
    # than a signal - a cosmetic ranking input must not sit on the profile-save
    # hot path.
    profile_count = models.PositiveIntegerField(default=0)

    # Lowercased name + aliases in one indexed column. JSON containment is
    # awkward on SQLite, and a single `icontains` over an indexed column is both
    # portable and fast enough at this size.
    search_blob = models.CharField(max_length=400, db_index=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["name"]

    def build_search_blob(self) -> str:
        parts = [self.name, *(self.aliases or [])]
        return " ".join(str(p).lower() for p in parts if p)[:400]

    def save(self, *args, **kwargs):
        self.search_blob = self.build_search_blob()
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            kwargs["update_fields"] = set(update_fields) | {"search_blob"}
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.country})"


class Institution(CatalogEntry):
    class Kind(models.TextChoices):
        SCHOOL = "school", "School"
        COLLEGE = "college", "College"
        UNIVERSITY = "university", "University"
        INSTITUTE = "institute", "Institute"

    kind = models.CharField(max_length=20, choices=Kind.choices, blank=True)

    class Meta(CatalogEntry.Meta):
        abstract = False
        ordering = ["name"]
        indexes = [
            models.Index(fields=["country", "name"]),
            models.Index(fields=["country", "reputation_tier"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["country", "name"], name="uniq_institution_country_name"
            )
        ]


class Employer(CatalogEntry):
    industry = models.CharField(max_length=80, blank=True)
    # Which `professionOptions` values this is offered for. Empty means "all",
    # so a general employer does not have to enumerate every profession.
    profession_tags = models.JSONField(default=list, blank=True)
    # The same tags as a delimited string, because SQLite has no JSON
    # containment lookup. Pipe-delimited and searched as "|value|" so that
    # "doctor" cannot match "doctorate" the way a bare LIKE would.
    profession_blob = models.CharField(max_length=400, blank=True, db_index=True)

    def build_profession_blob(self) -> str:
        tags = self.profession_tags or []
        if not tags:
            return ""
        return "|" + "|".join(str(t).strip().lower() for t in tags if t) + "|"

    def save(self, *args, **kwargs):
        self.profession_blob = self.build_profession_blob()
        update_fields = kwargs.get("update_fields")
        if update_fields is not None:
            kwargs["update_fields"] = set(update_fields) | {"profession_blob"}
        super().save(*args, **kwargs)

    class Meta(CatalogEntry.Meta):
        abstract = False
        ordering = ["name"]
        indexes = [
            models.Index(fields=["country", "name"]),
            models.Index(fields=["country", "reputation_tier"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["country", "name"], name="uniq_employer_country_name"
            )
        ]
