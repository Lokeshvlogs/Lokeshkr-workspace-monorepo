"""The public API of this app, for the host to call.

`interests.accept()` reaches in here to open a thread. Everything the host
needs is in this module, so the host never touches the models directly and the
storage stays free to change.
"""

from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.utils import timezone

from . import conf
from .models import Conversation, Message, Participant, participants_key


class MessagingError(Exception):
    """A refusal the router turns into a status code."""

    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


@transaction.atomic
def get_or_create_conversation(participants, kind: str = "", context_ref: str = ""):
    """Open the thread for these people, or return the one that exists.

    Idempotent through the unique `participants_key` rather than through a
    check-then-create, which races: two accepts landing together would
    otherwise both find nothing and both insert.
    """
    ids = [p.pk for p in participants]
    if len(set(ids)) < 2:
        raise MessagingError(400, "A conversation needs at least two different people.")

    key = participants_key(ids, kind)

    existing = Conversation.objects.filter(participants_key=key).first()
    if existing is not None:
        return existing

    try:
        with transaction.atomic():
            conversation = Conversation.objects.create(
                participants_key=key, kind=kind, context_ref=context_ref
            )
            Participant.objects.bulk_create(
                [Participant(conversation=conversation, participant=p) for p in participants]
            )
            return conversation
    except IntegrityError:
        # Lost the race. The winner's row is the answer.
        return Conversation.objects.get(participants_key=key)


def conversations_for(participant):
    """Every thread this participant is still in, most recent first."""
    return (
        Conversation.objects.filter(
            participants__participant=participant, participants__is_active=True
        )
        .filter(participants__archived_at__isnull=True)
        .distinct()
    )


def membership(conversation, participant) -> Participant:
    row = Participant.objects.filter(
        conversation=conversation, participant=participant
    ).first()
    if row is None:
        # 404 rather than 403: a 403 confirms the conversation exists.
        raise MessagingError(404, "Conversation not found.")
    return row


def unread_count(conversation, participant_row: Participant) -> int:
    qs = Message.objects.filter(conversation=conversation, deleted_at__isnull=True).exclude(
        sender_id=participant_row.participant_id
    )
    if participant_row.last_read_message_id:
        qs = qs.filter(id__gt=participant_row.last_read_message_id)
    return qs.count()


def unread_totals(participant) -> dict:
    """One query per conversation is fine at inbox size; the total is not.

    Archived conversations are excluded, matching `conversations_for`. Without
    that they still counted: `list_conversations` filters them out, so an
    archived thread with unread messages produced a badge that no list could
    show and no amount of reading could clear.
    """
    rows = Participant.objects.filter(
        participant=participant, is_active=True, archived_at__isnull=True
    ).select_related("conversation")
    per_conversation = {}
    total = 0
    for row in rows:
        n = unread_count(row.conversation, row)
        per_conversation[str(row.conversation.public_id)] = n
        total += n
    return {"total": total, "per_conversation": per_conversation}


@transaction.atomic
def post_message(conversation, sender, body: str, client_ref: str = "", kind: str = "text"):
    """Add a message, and move the conversation's denormalised summary with it."""
    body = (body or "").strip()
    if not body:
        raise MessagingError(400, "A message cannot be empty.")
    if len(body) > conf.MAX_BODY_LENGTH:
        raise MessagingError(400, f"Messages are limited to {conf.MAX_BODY_LENGTH} characters.")
    if conversation.is_closed:
        raise MessagingError(409, "This conversation is closed.")

    if client_ref:
        # The unique constraint would also catch this, but returning the
        # original is what makes a retry look like a success to the client.
        existing = Message.objects.filter(
            conversation=conversation, sender=sender, client_ref=client_ref
        ).first()
        if existing is not None:
            return existing

    message = Message.objects.create(
        conversation=conversation,
        sender=sender,
        body=body,
        kind=kind,
        client_ref=client_ref,
    )

    # Same transaction as the insert, so the inbox can never show a thread
    # ordered by a message that is not there yet.
    Conversation.objects.filter(pk=conversation.pk).update(
        last_message_at=message.created_at,
        last_message_preview=body[:140],
    )
    return message


def mark_read(participant_row: Participant, last_message_id: int) -> Participant:
    """Move the read watermark forward. Never backwards."""
    current = participant_row.last_read_message_id or 0
    if last_message_id > current:
        Participant.objects.filter(pk=participant_row.pk).update(
            last_read_message_id=last_message_id, last_read_at=timezone.now()
        )
        participant_row.refresh_from_db()
    return participant_row


def messages_page(conversation, before_id: int | None = None, after_id: int | None = None, limit: int = None):
    """One page of a thread.

    Keyset, not offset. Offset paging on a thread that is actively growing
    skips and duplicates rows as messages arrive - the single most common
    messaging bug.
    """
    limit = limit or conf.PAGE_SIZE
    qs = Message.objects.filter(conversation=conversation)

    if after_id:
        # Polling for new messages: oldest-first from a known point.
        return list(qs.filter(id__gt=after_id).order_by("id")[:limit])

    if before_id:
        qs = qs.filter(id__lt=before_id)

    # Newest `limit` rows, handed back in reading order.
    return list(reversed(list(qs.order_by("-id")[:limit])))
