"""Delete member accounts, and clean up what the cascade leaves behind.

    manage.py purge_members                       # report only, deletes nothing
    manage.py purge_members --yes                 # actually delete
    manage.py purge_members --keep-email a@b.com  # spare one more account

Reporting is the default and `--yes` is required to write, because the blast
radius is large and invisible from the call site. `Profile.user` is
`OneToOneField(User, on_delete=CASCADE)`, so one deleted User takes its Profile
and, transitively, its education rows, gallery photos, profile views in both
directions, interests sent and received, blocks in both directions, family
members, messaging participants and OTP codes.

**Staff is the only thing that decides who survives.** Not an email address:
a typo in one - a wrong domain, a wrong local part - silently spares nobody and
deletes the operator's own account, and the address is typed at the moment the
operator is least likely to check it. `--keep-email` exists as an extra net on
top of the staff rule, never as the only one.

Two things the cascade does not clean up, and this command does:

* **Conversations are orphaned.** `Message.sender` is SET_NULL and Conversation
  has no FK to Profile - only Participant does, and that cascades. So a
  conversation survives with zero participants and messages with a null sender.
* **Image files stay on disk.** Delegated to `sweep_media`, which owns that
  logic because it is also needed when nothing is being deleted at all.

One thing it deliberately does NOT clean up: `Block.blocked` is CASCADE, so
deleting an abusive account also erases the record that others blocked them.
That is a schema question, not something a purge should paper over; the report
names it when blocks are in scope.
"""

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models.deletion import Collector

from apps.messaging.models import Conversation
from apps.profiles.models import Block

from .sweep_media import find_orphans, sweep


class Command(BaseCommand):
    help = "Delete non-staff accounts and sweep the orphans the cascade leaves."

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Actually delete. Without it the command only reports.",
        )
        parser.add_argument(
            "--keep-email",
            action="append",
            default=[],
            metavar="EMAIL",
            help="Spare this address as well as every staff account. Repeatable.",
        )
        parser.add_argument(
            "--keep-media",
            action="store_true",
            help="Leave orphaned image files on disk.",
        )

    def handle(self, *args, **options):
        keep_emails = [email.strip().lower() for email in options["keep_email"] if email.strip()]

        # The guard that makes the staff rule meaningful. With no staff account
        # anywhere, "everyone except staff" is "everyone", including whoever is
        # running this - so refuse rather than do what was literally asked.
        if not User.objects.filter(is_staff=True).exists():
            raise CommandError(
                "No staff account exists, so this would delete every account "
                "including your own. Create a superuser first "
                "(manage.py createsuperuser)."
            )

        doomed = User.objects.filter(is_staff=False, is_superuser=False)
        for email in keep_emails:
            doomed = doomed.exclude(email__iexact=email).exclude(profile__email__iexact=email)

        doomed = list(doomed)
        spared = User.objects.count() - len(doomed)

        if not doomed:
            self.stdout.write(self.style.SUCCESS(f"Nothing to delete; {spared} account(s) kept."))
            return

        self._report(doomed, spared, keep_emails)

        if not options["yes"]:
            self.stdout.write(
                self.style.WARNING("\nNothing deleted - re-run with --yes to apply.")
            )
            return

        with transaction.atomic():
            User.objects.filter(pk__in=[user.pk for user in doomed]).delete()
            stale = Conversation.objects.filter(participants__isnull=True)
            conversations = stale.count()
            stale.delete()

        self.stdout.write(self.style.SUCCESS(f"\nDeleted {len(doomed)} account(s)."))
        self.stdout.write(f"Removed {conversations} conversation(s) left with no participants.")

        if options["keep_media"]:
            self.stdout.write("Left orphaned image files in place (--keep-media).")
            return

        # Recomputed after the delete rather than trusting the pre-delete list:
        # rows removed in between would otherwise be missed, and a file that
        # somehow gained a reference must not be unlinked.
        orphans = find_orphans()
        freed = sweep(orphans, delete=True)
        self.stdout.write(
            f"Deleted {len(orphans)} orphaned image file(s), {freed / (1024 * 1024):.1f} MB."
        )

    def _report(self, doomed, spared, keep_emails):
        collector = Collector(using="default")
        collector.collect(doomed)

        self.stdout.write(f"{len(doomed)} account(s) would be deleted, {spared} kept.")
        if keep_emails:
            self.stdout.write(f"Spared by --keep-email: {', '.join(keep_emails)}")

        # Both halves matter. A related model that cascades to nothing further
        # and fires no signals is put in `fast_deletes` as a bare queryset and
        # never appears in `.data` - which is most of what hangs off a Profile,
        # so reading only `.data` reports a purge of two tables when it is nine.
        counts = {
            model._meta.label: len(instances) for model, instances in collector.data.items()
        }
        for queryset in collector.fast_deletes:
            label = queryset.model._meta.label
            counts[label] = counts.get(label, 0) + queryset.count()

        self.stdout.write("\nRows that would go:")
        for label, count in sorted(counts.items()):
            if count:
                self.stdout.write(f"  {label:<32} {count}")

        blocks = Block.objects.filter(blocked__user__in=doomed).count()
        if blocks:
            self.stdout.write(
                self.style.WARNING(
                    f"\nNote: {blocks} block(s) against these accounts will be erased "
                    "along with them (Block.blocked is CASCADE), so the record that "
                    "other members blocked them does not survive."
                )
            )

        orphans = find_orphans()
        self.stdout.write(
            f"\n{len(orphans)} image file(s) are already orphaned before this runs; "
            "the sweep afterwards covers those too."
        )
