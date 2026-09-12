"""Load institutions and employers into the catalog.

    manage.py seed_catalog                      # curated YAML (default)
    manage.py seed_catalog --source=hipo        # downloads the dataset
    manage.py seed_catalog --source=hipo --path=world_universities.json
    manage.py seed_catalog --dry-run

Idempotent on `slug`, so it is safe to re-run after every deploy.

The rule that makes re-running safe: a bulk import never overwrites a row whose
`reputation_source` is "curated". Bulk sources carry no ranking signal and land
at tier 9; the hand-checked judgement in `data/*.yaml` is the thing worth
protecting, and without this guard one careless re-seed would flatten it.

The big open datasets are fetched at seed time rather than committed. Shipping
10k rows through `loaddata` in a migration would make every fresh `migrate`
depend on data that changes independently of the schema.

Without the bulk source the catalog holds only the curated YAML - 44 rows across
8 countries - so a member who studied in Sweden, France or Japan opened the
College/University field and found it empty. `--source=hipo` with no `--path`
now downloads the dataset itself, so that is one command rather than a manual
download somebody has to know about.
"""

import json
import re
import unicodedata
import urllib.request
from pathlib import Path

import yaml
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import Employer, Institution, ReputationTier

DATA_DIR = Path(__file__).resolve().parents[2] / "data"

#: ~10k universities across 200 countries, CC0, no key. The canonical home of
#: the `alpha_two_code` + `domains` shape `seed_hipo` reads.
HIPO_URL = (
    "https://raw.githubusercontent.com/Hipo/university-domains-list"
    "/master/world_universities_and_domains.json"
)

#: A seed is a deliberate, occasional command run by an operator, so it can
#: afford to wait far longer than a request path would.
HIPO_TIMEOUT_SECONDS = 120


def slugify(name: str, country: str) -> str:
    """A stable id from name + country.

    Country is part of the key because "University of York" exists in both GB
    and CA, and the model's uniqueness constraint is on (country, name).
    """
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    base = re.sub(r"[^a-z0-9]+", "_", ascii_name.lower()).strip("_")
    return f"{base}_{country.lower()}"[:160]


class Command(BaseCommand):
    help = "Seed or refresh the institution and employer catalog."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default="curated",
            choices=["curated", "hipo"],
            help="curated = the YAML in apps/catalog/data; hipo = a downloaded "
                 "world_universities_and_domains JSON file.",
        )
        parser.add_argument(
            "--path",
            help="File to read when --source=hipo. Omit to download the dataset.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing.",
        )

    def handle(self, *args, **options):
        if options["source"] == "curated":
            created, updated, skipped = self.seed_curated(options["dry_run"])
        else:
            created, updated, skipped = self.seed_hipo(options["path"], options["dry_run"])

        verb = "Would create" if options["dry_run"] else "Created"
        self.stdout.write(self.style.SUCCESS(f"{verb} {created}, updated {updated}."))
        if skipped:
            self.stdout.write(
                f"Left {skipped} curated row(s) untouched - a bulk source must not "
                f"overwrite a hand-checked tier."
            )

    # ---- curated YAML ----

    def seed_curated(self, dry_run: bool):
        created = updated = 0

        with transaction.atomic():
            created_i, updated_i = self._load_yaml(
                DATA_DIR / "institutions.yaml", Institution, dry_run, institution=True
            )
            created_e, updated_e = self._load_yaml(
                DATA_DIR / "employers.yaml", Employer, dry_run, institution=False
            )
            created = created_i + created_e
            updated = updated_i + updated_e

            if dry_run:
                transaction.set_rollback(True)

        return created, updated, 0

    def _load_yaml(self, path: Path, model, dry_run: bool, institution: bool):
        if not path.exists():
            self.stdout.write(self.style.WARNING(f"Missing {path.name}, skipping."))
            return 0, 0

        rows = yaml.safe_load(path.read_text(encoding="utf-8")) or []
        created = updated = 0

        for row in rows:
            name = row["name"].strip()
            country = row["country"].strip().upper()
            slug = slugify(name, country)

            fields = {
                "name": name,
                "country": country,
                "city": row.get("city", ""),
                "aliases": row.get("aliases", []) or [],
                "email_domains": row.get("domains", []) or [],
                "reputation_tier": row.get("tier", ReputationTier.UNRANKED),
                "reputation_source": "curated",
                "is_active": True,
            }
            if institution:
                fields["kind"] = row.get("kind", "")
            else:
                fields["industry"] = row.get("industry", "")
                fields["profession_tags"] = row.get("professions", []) or []

            existing = model.objects.filter(slug=slug).first()
            if existing:
                for key, value in fields.items():
                    setattr(existing, key, value)
                if not dry_run:
                    existing.save()
                updated += 1
            else:
                if not dry_run:
                    model.objects.create(slug=slug, **fields)
                created += 1

        self.stdout.write(f"  {path.name}: {created} new, {updated} refreshed")
        return created, updated

    # ---- bulk import ----

    def seed_hipo(self, path: str | None, dry_run: bool):
        """Hipolabs world_universities_and_domains (MIT licensed).

        Gives name, ISO-2 country and the email domains the edu-address check
        will need. It carries no ranking, so every row lands UNRANKED and the
        curated file supplies the tiers.
        """
        if path:
            source = Path(path)
            if not source.exists():
                self.stderr.write(self.style.ERROR(f"No such file: {source}"))
                return 0, 0, 0
            rows = json.loads(source.read_text(encoding="utf-8"))
        else:
            self.stdout.write(f"Downloading {HIPO_URL} ...")
            try:
                with urllib.request.urlopen(HIPO_URL, timeout=HIPO_TIMEOUT_SECONDS) as response:
                    rows = json.loads(response.read().decode("utf-8"))
            except Exception as exc:
                # Named rather than swallowed: an operator who ran this to fix
                # an empty dropdown needs to know it did not happen.
                self.stderr.write(
                    self.style.ERROR(
                        f"Could not download the dataset ({exc}). Pass --path to seed "
                        f"from a local copy instead."
                    )
                )
                return 0, 0, 0

        if not isinstance(rows, list):
            self.stderr.write(self.style.ERROR("Expected a JSON list of institutions."))
            return 0, 0, 0
        created = updated = skipped = 0
        batch = []

        existing = {
            institution.slug: institution
            for institution in Institution.objects.only("slug", "reputation_source")
        }

        for row in rows:
            name = (row.get("name") or "").strip()
            country = (row.get("alpha_two_code") or "").strip().upper()
            if not name or len(country) != 2:
                continue

            slug = slugify(name, country)
            found = existing.get(slug)

            if found is not None:
                # The whole point of the guard: a bulk file must never demote a
                # tier somebody checked by hand.
                if found.reputation_source == "curated":
                    skipped += 1
                    continue
                updated += 1
                continue

            batch.append(
                Institution(
                    slug=slug,
                    name=name,
                    country=country,
                    kind=Institution.Kind.UNIVERSITY,
                    email_domains=row.get("domains", []) or [],
                    reputation_tier=ReputationTier.UNRANKED,
                    reputation_source="hipo",
                    search_blob=name.lower()[:400],
                )
            )
            created += 1

        if not dry_run and batch:
            Institution.objects.bulk_create(batch, batch_size=500, ignore_conflicts=True)

        return created, updated, skipped
