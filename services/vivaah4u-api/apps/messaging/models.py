"""Conversations, participants and messages.

Generic on purpose: nothing here knows what a participant *is* beyond the model
named by `conf.PARTICIPANT_MODEL`, and there is not a single matrimonial field
in the file.
"""

import uuid

from django.db import models

from . import conf


def participants_key(participant_ids, kind: str = "") -> str:
    """A stable identity for "these people, in this kind of thread".

    Sorted, so the key does not depend on who opened it. Unique in the
    database, which is what makes "open a chat with X" idempotent rather than
    a race that can land two conversations.
    """
    joined = "-".join(str(pk) for pk in sorted(int(pk) for pk in participant_ids))
    return f"{kind}:{joined}" if kind else joined


class Conversation(models.Model):
    #: Public handle. Sequential integers in a URL are enumerable, and the host
    #: already avoids that for profiles.
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    #: Namespace, so one deployment can carry "match" threads and "support"
    #: threads without a schema change.
    kind = models.CharField(max_length=30, blank=True, db_index=True)

    #: An opaque reference the HOST understands - Vivah4U stores the interest
    #: id here. A CharField and never a ForeignKey, because a ForeignKey would
    #: be an import, and an import would end the portability.
    context_ref = models.CharField(max_length=64, blank=True, db_index=True)

    #: See `participants_key`.
    participants_key = models.CharField(max_length=200, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)

    #: Denormalised so the inbox can order and preview without a GROUP BY MAX
    #: over every message ever sent.
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_message_preview = models.CharField(max_length=140, blank=True)

    is_closed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-last_message_at", "-id"]

    def __str__(self):
        return f"conversation {self.public_id}"


class Participant(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="participants"
    )
    # related_name="+" is not optional: a reusable app must not bolt accessors
    # onto the host's model, or two such apps collide on the same name.
    participant = models.ForeignKey(
        conf.PARTICIPANT_MODEL, on_delete=models.CASCADE, related_name="+"
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    #: Read state as a watermark rather than one row per (message, reader).
    #: The only two questions a thread ever asks are "how many since I last
    #: looked" and "have they seen mine", and a watermark answers both with one
    #: UPDATE and one COUNT. Per-message rows cost a row per message per reader
    #: forever and buy out-of-order reading that no UI here offers.
    #:
    #: A plain integer, not an FK, to keep the hot inbox query free of a second
    #: join. Message ids are monotonic within a conversation, which is all this
    #: needs; they are never compared across conversations.
    last_read_message_id = models.BigIntegerField(null=True, blank=True)
    last_read_at = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_muted = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "participant"], name="uniq_conversation_participant"
            ),
        ]
        indexes = [models.Index(fields=["participant", "-id"])]

    def __str__(self):
        return f"{self.participant_id} in {self.conversation_id}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    # SET_NULL, never CASCADE: deleting an account must not erase the other
    # person's half of the conversation.
    sender = models.ForeignKey(
        conf.PARTICIPANT_MODEL, on_delete=models.SET_NULL, null=True, related_name="+"
    )

    body = models.TextField()
    kind = models.CharField(max_length=20, default="text")

    #: Client-generated idempotency key. A retried POST over a flaky mobile
    #: connection must not post the message twice.
    client_ref = models.CharField(max_length=64, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    #: Soft, so the thread still reads correctly around a removed message.
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["id"]
        indexes = [models.Index(fields=["conversation", "-id"])]
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "sender", "client_ref"],
                condition=~models.Q(client_ref=""),
                name="uniq_message_client_ref",
            ),
        ]

    def __str__(self):
        return f"message {self.pk} in {self.conversation_id}"
