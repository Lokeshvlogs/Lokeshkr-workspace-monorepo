"""HTTP routes. Every rule lives in `services.py`; this maps outcomes to codes."""

from typing import List, Optional

from ninja import Router, Schema
from ninja.errors import HttpError

from . import conf, services
from .models import Conversation, Message, Participant

router = Router(tags=["messaging"])


class StartIn(Schema):
    participant_ids: List[int]
    kind: str = ""
    context_ref: str = ""


class PostIn(Schema):
    body: str
    client_ref: str = ""


class ReadIn(Schema):
    last_message_id: int


def _actor(request):
    actor = conf.participant_for_request(request)
    if actor is None:
        raise HttpError(401, "Not signed in.")
    return actor


def _guard(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except services.MessagingError as error:
        raise HttpError(error.status, error.message)


def _conversation(public_id: str) -> Conversation:
    conversation = Conversation.objects.filter(public_id=public_id).first()
    if conversation is None:
        raise HttpError(404, "Conversation not found.")
    return conversation


def _others(conversation, actor, request):
    rows = (
        Participant.objects.filter(conversation=conversation)
        .exclude(participant_id=actor.pk)
        .select_related("participant")
    )
    return [conf.serialize_participant(row.participant, request) for row in rows]


def _conversation_out(conversation, actor, request, unread: int) -> dict:
    return {
        "id": str(conversation.public_id),
        "kind": conversation.kind,
        "context_ref": conversation.context_ref,
        "last_message_at": conversation.last_message_at.isoformat()
        if conversation.last_message_at
        else None,
        "last_message_preview": conversation.last_message_preview,
        "unread_count": unread,
        "is_closed": conversation.is_closed,
        "others": _others(conversation, actor, request),
    }


def _message_out(message: Message, actor) -> dict:
    return {
        "id": message.id,
        "body": "" if message.deleted_at else message.body,
        "kind": message.kind,
        "is_mine": message.sender_id == actor.pk,
        "client_ref": message.client_ref,
        "created_at": message.created_at.isoformat(),
        "deleted": bool(message.deleted_at),
    }


@router.get("/conversations", auth=conf.auth)
def list_conversations(request, limit: int = 30, offset: int = 0):
    actor = _actor(request)
    limit = max(1, min(limit, 50))

    qs = services.conversations_for(actor)
    total = qs.count()
    rows = list(qs[offset : offset + limit])

    by_conversation = {
        row.conversation_id: row
        for row in Participant.objects.filter(participant=actor, conversation__in=rows)
    }

    results = []
    for conversation in rows:
        membership = by_conversation.get(conversation.pk)
        unread = services.unread_count(conversation, membership) if membership else 0
        results.append(_conversation_out(conversation, actor, request, unread))

    return {"results": results, "total": total, "has_more": offset + limit < total}


@router.post("/conversations", auth=conf.auth)
def start_conversation(request, data: StartIn):
    actor = _actor(request)

    model = Participant._meta.get_field("participant").remote_field.model
    others = list(model.objects.filter(pk__in=data.participant_ids).exclude(pk=actor.pk))
    if not others:
        raise HttpError(400, "Nobody to talk to.")

    # The host's rule, consulted through the seam. This app has no opinion on
    # who may talk to whom.
    if not conf.can_start_conversation(actor, others):
        raise HttpError(403, "You cannot start a conversation with this member yet.")

    conversation = _guard(
        services.get_or_create_conversation, [actor, *others], data.kind, data.context_ref
    )
    membership = _guard(services.membership, conversation, actor)
    return _conversation_out(
        conversation, actor, request, services.unread_count(conversation, membership)
    )


@router.get("/conversations/{public_id}", auth=conf.auth)
def get_conversation(request, public_id: str):
    actor = _actor(request)
    conversation = _conversation(public_id)
    membership = _guard(services.membership, conversation, actor)
    return _conversation_out(
        conversation, actor, request, services.unread_count(conversation, membership)
    )


@router.get("/conversations/{public_id}/messages", auth=conf.auth)
def list_messages(
    request,
    public_id: str,
    before_id: Optional[int] = None,
    after_id: Optional[int] = None,
    limit: int = None,
):
    actor = _actor(request)
    conversation = _conversation(public_id)
    _guard(services.membership, conversation, actor)

    rows = services.messages_page(conversation, before_id, after_id, limit)
    return {
        "results": [_message_out(m, actor) for m in rows],
        # Only meaningful walking backwards; polling forwards is open-ended.
        "has_more": bool(before_id is None or rows) and len(rows) == (limit or conf.PAGE_SIZE),
    }


@router.post("/conversations/{public_id}/messages", auth=conf.auth)
def send_message(request, public_id: str, data: PostIn):
    actor = _actor(request)
    conversation = _conversation(public_id)
    _guard(services.membership, conversation, actor)

    if not conf.can_post_message(actor, conversation):
        raise HttpError(403, "You cannot post to this conversation.")

    message = _guard(services.post_message, conversation, actor, data.body, data.client_ref)
    return _message_out(message, actor)


@router.post("/conversations/{public_id}/read", auth=conf.auth)
def mark_read(request, public_id: str, data: ReadIn):
    actor = _actor(request)
    conversation = _conversation(public_id)
    membership = _guard(services.membership, conversation, actor)

    row = services.mark_read(membership, data.last_message_id)
    return {"last_read_message_id": row.last_read_message_id}


@router.post("/conversations/{public_id}/archive", auth=conf.auth)
def archive(request, public_id: str):
    from django.utils import timezone

    actor = _actor(request)
    conversation = _conversation(public_id)
    membership = _guard(services.membership, conversation, actor)

    Participant.objects.filter(pk=membership.pk).update(archived_at=timezone.now())
    return {"archived": True}


@router.get("/unread", auth=conf.auth)
def unread(request):
    return services.unread_totals(_actor(request))


@router.get("/poll", auth=conf.auth)
def poll(request):
    """The cheapest endpoint here - no message bodies, just what moved.

    Every client reads through this, so swapping polling for SSE or Channels
    later is one endpoint and one hook rather than a rewrite.
    """
    actor = _actor(request)
    totals = services.unread_totals(actor)

    rows = services.conversations_for(actor)[:50]
    return {
        "unread_total": totals["total"],
        "conversations": [
            {
                "id": str(c.public_id),
                "last_message_at": c.last_message_at.isoformat() if c.last_message_at else None,
                "unread": totals["per_conversation"].get(str(c.public_id), 0),
            }
            for c in rows
        ],
    }
