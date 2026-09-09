"""Expressing interest in another member, and what happens next.

Every transition lives here rather than in the router, so the rules are stated
once and can be reused by the messaging gate and by the admin. The router's job
is to turn the outcomes below into status codes.
"""

from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from .models import Block, Interest, Profile, interest_pair_key

#: How many interests one member may send in a rolling day. Cheap anti-spam
#: with no new dependency; a real rate limiter can replace it later.
MAX_PER_DAY = 20

#: A decline is not permanent, but it is expensive: one re-send, after a wait.
RESEND_COOLDOWN_DAYS = 30
MAX_RESENDS = 1


class InterestError(Exception):
    """A refusal the router turns into a status code."""

    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def is_blocked_between(a: Profile, b: Profile) -> bool:
    """Blocking cuts both ways, whoever pressed the button."""
    return Block.objects.filter(
        Q(blocker=a, blocked=b) | Q(blocker=b, blocked=a)
    ).exists()


def blocked_profile_ids(profile: Profile) -> set[int]:
    """Every profile that must not appear to, or see, this member."""
    pairs = Block.objects.filter(Q(blocker=profile) | Q(blocked=profile)).values_list(
        "blocker_id", "blocked_id"
    )
    ids: set[int] = set()
    for blocker_id, blocked_id in pairs:
        ids.add(blocker_id)
        ids.add(blocked_id)
    ids.discard(profile.pk)
    return ids


def is_accepted_between(a: Profile, b: Profile) -> bool:
    """Whether these two have a mutual, accepted interest.

    This is the gate messaging will consult. It reads the pair key rather than
    a direction, because once an interest is accepted it stops mattering who
    asked first.
    """
    return Interest.objects.filter(
        pair_key=interest_pair_key(a.pk, b.pk), status=Interest.Status.ACCEPTED
    ).exists()


def _sent_today(profile: Profile) -> int:
    return Interest.objects.filter(
        sender=profile, created_at__gte=timezone.now() - timedelta(days=1)
    ).count()


@transaction.atomic
def send(sender: Profile, receiver: Profile, message: str = "") -> tuple[Interest, bool]:
    """Express interest. Returns the row and whether it became mutual.

    The refusal messages are deliberately vague and shared between several
    causes. A distinct "you are blocked" would make blocking detectable by
    probing, which defeats it.
    """
    if sender.pk == receiver.pk:
        raise InterestError(400, "You cannot express interest in your own profile.")

    if is_blocked_between(sender, receiver):
        raise InterestError(403, "This member is not accepting interests right now.")

    if receiver.hide or receiver.hide_profile_from_search:
        raise InterestError(403, "This member is not accepting interests right now.")

    # A crossing interest is an agreement, not a second request. Flipping the
    # existing row is also what keeps the live-pair constraint satisfiable.
    reverse = Interest.objects.select_for_update().filter(
        sender=receiver, receiver=sender, status=Interest.Status.PENDING
    ).first()
    if reverse is not None:
        reverse.status = Interest.Status.ACCEPTED
        reverse.responded_at = timezone.now()
        reverse.save(update_fields=["status", "responded_at"])
        open_conversation(reverse)
        return reverse, True

    existing = Interest.objects.select_for_update().filter(
        sender=sender, receiver=receiver
    ).first()

    if existing is not None:
        if existing.status in Interest.LIVE_STATUSES:
            # Idempotent rather than an error: a double-tap should not read as
            # a failure when the outcome the member wanted already holds.
            return existing, existing.status == Interest.Status.ACCEPTED

        if existing.status == Interest.Status.DECLINED:
            if existing.resend_count >= MAX_RESENDS:
                raise InterestError(409, "You have already asked again once.")
            waited = existing.responded_at is not None and (
                timezone.now() - existing.responded_at >= timedelta(days=RESEND_COOLDOWN_DAYS)
            )
            if not waited:
                raise InterestError(
                    409,
                    f"You can ask again {RESEND_COOLDOWN_DAYS} days after a decline.",
                )
            existing.resend_count += 1

        # Withdrawn, or a declined row past its cooldown: reuse the row so the
        # resend counter and the pair history survive.
        existing.status = Interest.Status.PENDING
        existing.responded_at = None
        existing.seen_at = None
        existing.message = message
        existing.created_at = timezone.now()
        existing.save(
            update_fields=[
                "status", "responded_at", "seen_at", "message", "created_at", "resend_count",
            ]
        )
        return existing, False

    if _sent_today(sender) >= MAX_PER_DAY:
        raise InterestError(429, "You have reached today's limit. Try again tomorrow.")

    return (
        Interest.objects.create(sender=sender, receiver=receiver, message=message),
        False,
    )


def open_conversation(interest: Interest):
    """Give an accepted pair somewhere to talk.

    Imported inside the function rather than at module scope: the host may run
    without the messaging app installed, and an accepted interest is still a
    valid outcome when it does. A failure here must not roll back the accept.
    """
    try:
        from apps.messaging import services as messaging
    except ImportError:
        return None

    try:
        return messaging.get_or_create_conversation(
            [interest.sender, interest.receiver], kind="match", context_ref=str(interest.id)
        )
    except Exception:
        # The thread can be opened again on first use; losing the accept
        # because chat had a bad day would be far worse.
        return None


def _load(interest_id: int) -> Interest:
    interest = Interest.objects.filter(pk=interest_id).first()
    if interest is None:
        raise InterestError(404, "Interest not found.")
    return interest


@transaction.atomic
def accept(interest_id: int, actor: Profile) -> Interest:
    interest = _load(interest_id)
    if interest.receiver_id != actor.pk:
        raise InterestError(403, "Only the person who received this can accept it.")
    if interest.status != Interest.Status.PENDING:
        raise InterestError(409, "This interest has already been answered.")

    interest.status = Interest.Status.ACCEPTED
    interest.responded_at = timezone.now()
    interest.save(update_fields=["status", "responded_at"])
    open_conversation(interest)
    return interest


@transaction.atomic
def decline(interest_id: int, actor: Profile, block: bool = False) -> Interest:
    interest = _load(interest_id)
    if interest.receiver_id != actor.pk:
        raise InterestError(403, "Only the person who received this can decline it.")
    if interest.status != Interest.Status.PENDING:
        raise InterestError(409, "This interest has already been answered.")

    interest.status = Interest.Status.DECLINED
    interest.responded_at = timezone.now()
    interest.save(update_fields=["status", "responded_at"])

    if block:
        Block.objects.get_or_create(blocker=actor, blocked=interest.sender)

    return interest


@transaction.atomic
def withdraw(interest_id: int, actor: Profile) -> Interest:
    interest = _load(interest_id)
    if interest.sender_id != actor.pk:
        raise InterestError(403, "Only the sender can withdraw this.")
    if interest.status != Interest.Status.PENDING:
        raise InterestError(409, "This interest has already been answered.")

    interest.status = Interest.Status.WITHDRAWN
    interest.responded_at = timezone.now()
    interest.save(update_fields=["status", "responded_at"])
    return interest


def for_tab(profile: Profile, tab: str):
    """The queryset behind one inbox tab.

    `declined` is sender-only on purpose. Handing receivers a list of the people
    they turned down serves nobody and invites re-litigating a closed decision.
    """
    if tab == "received":
        return Interest.objects.filter(receiver=profile, status=Interest.Status.PENDING)
    if tab == "sent":
        return Interest.objects.filter(sender=profile, status=Interest.Status.PENDING)
    if tab == "accepted":
        # One list, both directions: once it is mutual, who asked stopped
        # mattering.
        return Interest.objects.filter(
            Q(sender=profile) | Q(receiver=profile), status=Interest.Status.ACCEPTED
        )
    if tab == "declined":
        return Interest.objects.filter(sender=profile, status=Interest.Status.DECLINED)
    raise InterestError(400, "Unknown tab.")


def counts(profile: Profile) -> dict:
    """The badge feed.

    `received_pending` and `received_unseen` are separate on purpose: the first
    is the tab header and persists until the member answers, the second is the
    red dot and clears on sight. Conflating them means the badge never clears
    while anything is outstanding, which trains people to ignore it.
    """
    received = Interest.objects.filter(receiver=profile, status=Interest.Status.PENDING)
    return {
        "received_pending": received.count(),
        "received_unseen": received.filter(seen_at__isnull=True).count(),
        "sent_pending": Interest.objects.filter(
            sender=profile, status=Interest.Status.PENDING
        ).count(),
        "accepted": Interest.objects.filter(
            Q(sender=profile) | Q(receiver=profile), status=Interest.Status.ACCEPTED
        ).count(),
        "declined": Interest.objects.filter(
            sender=profile, status=Interest.Status.DECLINED
        ).count(),
    }


def mark_seen(profile: Profile) -> int:
    """Clear the red dot without touching the outstanding count."""
    return Interest.objects.filter(
        receiver=profile, status=Interest.Status.PENDING, seen_at__isnull=True
    ).update(seen_at=timezone.now())
