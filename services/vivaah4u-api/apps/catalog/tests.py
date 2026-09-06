"""Tests for the catalog search API.

The single most important guarantee here is that `reputation_tier` and
`email_domains` never reach a client. Reputation is the product's own editorial
judgement, and a member who could read it would know exactly which answer ranks
best; the domains are the hook a future email check depends on. Both shape the
results, and neither appears in them.
"""

from django.contrib.auth.models import User
from django.test import TestCase
from ninja_jwt.tokens import RefreshToken

from apps.catalog.models import Employer, Institution, ReputationTier
from apps.catalog.visa import options_for


class CatalogApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        Institution.objects.create(
            slug="elite_in", name="Elite Institute of Technology", country="IN",
            city="Mumbai", kind="institute",
            aliases=["EIT"], email_domains=["elite.ac.in"],
            reputation_tier=ReputationTier.ELITE, reputation_source="curated",
        )
        Institution.objects.create(
            slug="ordinary_in", name="Elite Adjacent College", country="IN",
            kind="college", email_domains=["eac.ac.in"],
            reputation_tier=ReputationTier.UNRANKED, reputation_source="hipo",
        )
        Institution.objects.create(
            slug="us_one", name="Elite American University", country="US",
            kind="university", reputation_tier=ReputationTier.STRONG,
        )
        Institution.objects.create(
            slug="inactive_in", name="Elite Closed School", country="IN",
            kind="school", is_active=False, reputation_tier=ReputationTier.ELITE,
        )
        Employer.objects.create(
            slug="tech_in", name="Techy Corp", country="IN",
            email_domains=["techy.com"], profession_tags=["software_engineer"],
            reputation_tier=ReputationTier.ELITE,
        )
        Employer.objects.create(
            slug="general_in", name="Techy General Holdings", country="IN",
            profession_tags=[], reputation_tier=ReputationTier.STANDARD,
        )

    def setUp(self):
        self.user = User.objects.create_user(username="seeker", password="x")
        token = RefreshToken.for_user(self.user).access_token
        self.auth = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def get(self, path, **params):
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return self.client.get(f"/api/catalog/{path}?{query}", **self.auth)

    def test_requires_authentication(self):
        """The facts are public; the curation is the product. Do not give it away."""
        response = self.client.get("/api/catalog/institutions?q=elite")
        self.assertEqual(response.status_code, 401)

    def test_reputation_and_domains_never_serialised(self):
        response = self.get("institutions", q="elite", country="IN")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["results"])

        raw = response.content.decode()
        for leak in ("reputation", "email_domains", "elite.ac.in", "profile_count", "search_blob"):
            self.assertNotIn(leak, raw, f"{leak} must not reach the client")

        self.assertEqual(
            set(body["results"][0]), {"slug", "name", "country", "city", "kind"}
        )

    def test_better_reputation_ranks_first(self):
        """Reputation is invisible but still does the work."""
        results = self.get("institutions", q="elite", country="IN").json()["results"]
        self.assertEqual(results[0]["slug"], "elite_in")

    def test_country_filter(self):
        results = self.get("institutions", q="elite", country="US").json()["results"]
        self.assertEqual([r["slug"] for r in results], ["us_one"])

    def test_inactive_rows_are_hidden(self):
        slugs = [r["slug"] for r in self.get("institutions", q="elite").json()["results"]]
        self.assertNotIn("inactive_in", slugs)

    def test_short_query_returns_popular_rows_not_nothing(self):
        """One character cannot narrow anything, so show something useful."""
        body = self.get("institutions", q="e", country="IN").json()
        self.assertTrue(body["results"])
        self.assertEqual(body["results"][0]["slug"], "elite_in")

    def test_alias_is_searchable(self):
        slugs = [r["slug"] for r in self.get("institutions", q="eit").json()["results"]]
        self.assertIn("elite_in", slugs)

    def test_pagination_reports_more(self):
        body = self.get("institutions", q="elite", limit=1).json()
        self.assertEqual(len(body["results"]), 1)
        self.assertTrue(body["has_more"])
        self.assertEqual(body["next_cursor"], 1)

        second = self.get("institutions", q="elite", limit=1, cursor=1).json()
        self.assertNotEqual(second["results"][0]["slug"], body["results"][0]["slug"])

    def test_employer_profession_filter_keeps_untagged_employers(self):
        """An empty tag list means "any profession", not "no professions"."""
        slugs = [
            r["slug"]
            for r in self.get("employers", q="techy", profession="software_engineer").json()["results"]
        ]
        self.assertIn("tech_in", slugs)
        self.assertIn("general_in", slugs)

    def test_employer_profession_filter_excludes_mismatches(self):
        slugs = [
            r["slug"] for r in self.get("employers", q="techy", profession="doctor").json()["results"]
        ]
        self.assertNotIn("tech_in", slugs)
        self.assertIn("general_in", slugs)

    def test_visa_statuses_vary_by_country(self):
        us = [o["value"] for o in self.get("visa-statuses", country="US").json()]
        self.assertIn("green_card", us)
        self.assertNotIn("oci", us)

        india = [o["value"] for o in self.get("visa-statuses", country="IN").json()]
        self.assertIn("oci", india)

    def test_unknown_country_falls_back_to_generic(self):
        values = [o["value"] for o in options_for("ZZ")]
        self.assertIn("work_visa", values)
        self.assertIn("other", values)


class CatalogModelTests(TestCase):
    def test_search_blob_includes_aliases(self):
        institution = Institution.objects.create(
            slug="iisc_in", name="Indian Institute of Science", country="IN",
            aliases=["IISc", "IISc Bangalore"],
        )
        self.assertIn("iisc", institution.search_blob)
        self.assertIn("indian institute of science", institution.search_blob)

    def test_search_blob_refreshes_on_update_fields_save(self):
        """Same trap as Profile: an explicit field list must not drop derived data."""
        institution = Institution.objects.create(
            slug="x_in", name="Old Name", country="IN",
        )
        institution.name = "New Name"
        institution.save(update_fields=["name"])

        fresh = Institution.objects.get(pk=institution.pk)
        self.assertIn("new name", fresh.search_blob)
