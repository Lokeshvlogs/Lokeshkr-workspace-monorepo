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


def accepted_profile_ids(profile: Profile) -> set[int]:
    """Everyone this member is already connected to.

    They belong in the interests inbox's accepted tab, not back in the search
    grid: a match list exists to find people you have not met yet, and a member
    you are already chatting to takes a card away from one you are not.
    """
    pairs = Interest.objects.filter(
        Q(sender=profile) | Q(receiver=profile), status=Interest.Status.ACCEPTED
    ).values_list("sender_id", "receiver_id")

    ids: set[int] = set()
    for sender_id, receiver_id in pairs:
        ids.add(sender_id)
        ids.add(receiver_id)
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


def states_for(profile: Profile) -> dict[int, dict]:
    """Every interest touching `profile`, keyed by the OTHER profile's pk.

    One query for a whole page of matches. The alternative - asking
    `is_accepted_between` per row - is 48 queries to paint 48 buttons, and it
    could only ever answer "mutual or not": pending, declined and withdrawn all
    come back False from it, and the card needs to tell those apart.

    A pair can hold more than one row: `uniq_live_interest_per_pair` only covers
    pending and accepted, so a declined A->B can sit beside a live B->A. The
    live one is what the buttons should reflect, so it wins.
    """
    rows = Interest.objects.filter(
        Q(sender=profile) | Q(receiver=profile)
    ).values_list("sender_id", "receiver_id", "status", "id", "created_at")

    states: dict[int, dict] = {}
    for sender_id, receiver_id, status, interest_id, created_at in rows:
        outgoing = sender_id == profile.pk
        other_id = receiver_id if outgoing else sender_id
        current = states.get(other_id)
        live = status in Interest.LIVE_STATUSES

        if current is not None:
            # A live row always wins; between two dead ones, the newer.
            if not live and (current["live"] or current["created_at"] >= created_at):
                continue
            if live and current["live"] and current["created_at"] >= created_at:
                continue

        states[other_id] = {
            "id": interest_id,
            "status": status,
            "direction": "sent" if outgoing else "received",
            "live": live,
            "created_at": created_at,
        }

    return states


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


@transaction.atomic
def block(actor: Profile, other: Profile) -> None:
    """Cut contact with `other`, both ways, and tidy up what is already open.

    Inserting the row is not enough. `Block` has never touched an Interest or a
    Conversation, so a blocked pair that had already accepted would keep a live
    interest and an open thread - and until `messaging_hooks._reachable` learned
    about blocks, keep posting to it.

    Everything here is idempotent: blocking twice is the state the caller asked
    for, not an error.
    """
    if actor.pk == other.pk:
        raise InterestError(400, "You cannot block yourself.")

    Block.objects.get_or_create(blocker=actor, blocked=other)

    # At most one row, guaranteed by uniq_live_interest_per_pair. Declined
    # rather than withdrawn whoever sent it: withdrawn means "the sender
    # changed their mind", which is not what happened.
    Interest.objects.filter(
        pair_key=interest_pair_key(actor.pk, other.pk), status__in=Interest.LIVE_STATUSES
    ).update(status=Interest.Status.DECLINED, responded_at=timezone.now())

    _close_conversation(actor, other)


def _close_conversation(a: Profile, b: Profile) -> None:
    """Shut the pair's thread, if the messaging app is installed and has one."""
    try:
        from apps.messaging.models import Conversation, participants_key
    except ImportError:
        return

    try:
        key = participants_key([a.pk, b.pk], "match")
        Conversation.objects.filter(participants_key=key).update(is_closed=True)
    except Exception:
        # Same reasoning as open_conversation: chat having a bad day must not
        # cost the member the block they just asked for. The gate in
        # messaging_hooks stops the thread either way.
        return


def unblock(actor: Profile, other: Profile) -> None:
    """Undo a block. The declined interest and closed thread are NOT revived.

    Deliberately: re-accepting on the other side's behalf would be speaking for
    them. Unblocking puts the member back in the pool, and a fresh interest is
    how the pair starts again.
    """
    Block.objects.filter(blocker=actor, blocked=other).delete()


def blocked_by(profile: Profile):
    """Everyone this member has blocked, newest first. Their own list only."""
    return (
        Block.objects.filter(blocker=profile)
        .select_related("blocked")
        .order_by("-created_at")
    )


def conversation_with(me: Profile, other: Profile):
    """The thread these two share, opening it if the accept never managed to.

    `open_conversation` swallows every exception on purpose, so an accepted pair
    can legitimately exist with no Conversation row behind it. The Chat button
    cannot assume one is there, and `get_or_create_conversation` is idempotent
    through its unique participants_key, so asking again costs nothing.
    """
    if not is_accepted_between(me, other):
        raise InterestError(403, "You can only chat once an interest is mutual.")
    if is_blocked_between(me, other):
        raise InterestError(403, "This member is not accepting messages right now.")

    try:
        from apps.messaging import services as messaging
    except ImportError:
        raise InterestError(503, "Chat is not available right now.")

    live = Interest.objects.filter(
        pair_key=interest_pair_key(me.pk, other.pk), status=Interest.Status.ACCEPTED
    ).first()
    return messaging.get_or_create_conversation(
        [me, other], kind="match", context_ref=str(live.id) if live else ""
    )


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
