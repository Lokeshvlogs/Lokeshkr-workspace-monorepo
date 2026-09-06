"""Report profiles whose stored completeness disagrees with a fresh recompute.

The regression net for the profile-schema work. Run before and after each
migration:

    service.bat vivaah4u-api manage check_profile_drift

Two separate things are checked, and only the first is an error:

1. STALENESS - the stored `profile_completeness` differs from what the current
   rules produce. That means some rows were not re-saved after a rule change,
   so members are being shown an out-of-date number. Exits non-zero.

2. ELIGIBILITY - how many profiles are currently `is_complete`, and which are
   not. Informational: run it either side of a migration and the counts should
   match. Eligibility is measured against the FROZEN core field set, so it can
   only move if the core data itself changed.

Note what is deliberately NOT done here: eligibility is not inferred by
comparing the stored percentage against the 95 threshold. Those two numbers live
on different scales now - the headline percentage covers every field the wizard
asks for, while eligibility covers only the core - and comparing them reported a
flood of false flips the moment the first extra field landed.
"""

from django.core.management.base import BaseCommand

from apps.profiles.models import Profile


class Command(BaseCommand):
    help = "Report (or repair) profiles whose stored completeness has drifted."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fix",
            action="store_true",
            help="Persist the recomputed completeness for stale rows.",
        )

    def handle(self, *args, **options):
        stale = []
        ineligible = []

        profiles = list(Profile.objects.all())
        for profile in profiles:
            fresh = profile.compute_completeness()
            if fresh != profile.profile_completeness:
                stale.append((profile, profile.profile_completeness, fresh))
            if not profile.is_complete:
                ineligible.append(profile)

        core_total = Profile()._core_total()
        extra = len(Profile.EXTRA_TEXT_FIELDS) + len(Profile.EXTRA_LIST_FIELDS)
        self.stdout.write(
            f"Checked {len(profiles)} profiles "
            f"({core_total} core + {extra} extra scored fields)."
        )

        # --- Eligibility, informational ---
        eligible = len(profiles) - len(ineligible)
        self.stdout.write(f"\nEligible for matches: {eligible} / {len(profiles)}")
        if ineligible:
            self.stdout.write("In setup (core fields incomplete):")
            for profile in ineligible[:20]:
                self.stdout.write(
                    f"  {profile.profile_id or profile.pk}: core {profile.core_completeness()}%"
                )
            if len(ineligible) > 20:
                self.stdout.write(f"  ... and {len(ineligible) - 20} more")

        # --- Staleness, the actual error condition ---
        if not stale:
            self.stdout.write(self.style.SUCCESS("\nNo stale percentages."))
            return

        self.stdout.write(
            self.style.WARNING(f"\n{len(stale)} profile(s) with a stale percentage:")
        )
        for profile, stored, fresh in stale[:20]:
            self.stdout.write(f"  {profile.profile_id or profile.pk}: {stored}% -> {fresh}%")
        if len(stale) > 20:
            self.stdout.write(f"  ... and {len(stale) - 20} more")

        if options["fix"]:
            for profile, _stored, _fresh in stale:
                profile.save(update_fields=["profile_completeness"])
            self.stdout.write(self.style.SUCCESS(f"\nRepaired {len(stale)} rows."))
            return

        self.stdout.write("\nRe-run with --fix to repair, or re-save the affected rows.")
        raise SystemExit(1)
