"""Conversations, participants and messages - read-only throughout.

Support needs to see a thread to answer "my messages are not sending" or "this
person is harassing me". It must not be able to edit one: `last_message_at` and
`last_message_preview` are denormalised from the messages, `last_read_message_id`
is the unread watermark the whole inbox counts against, and `participants_key`
is a uniqueness constraint that makes opening a chat idempotent. Every one of
those is maintained by the app and corrupted by a hand edit.

`Participant` is the only route from a member to their threads, because
`related_name="+"` on both FKs means Profile has no reverse accessor by design -
a reusable app must not bolt names onto its host's model.

Deletion stays available on Conversation alone: removing an abusive thread
wholesale is a real support action, and its messages and participants cascade.
"""

from django.contrib import admin

from .models import Conversation, Message, Participant


class NoEdit:
    """Listable and searchable, never editable."""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class ParticipantInline(NoEdit, admin.TabularInline):
    model = Participant
    extra = 0
    fields = ("participant", "joined_at", "last_read_message_id", "last_read_at",
              "is_active", "is_muted")
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Conversation)
class ConversationAdmin(NoEdit, admin.ModelAdmin):
    list_display = ("id", "public_id", "kind", "context_ref", "participant_count",
                    "message_count", "last_message_at", "is_closed")
    list_filter = ("kind", "is_closed")
    search_fields = ("public_id", "context_ref", "participants_key",
                     "participants__participant__profile_id")
    ordering = ("-last_message_at", "-id")
    inlines = [ParticipantInline]
    date_hierarchy = "created_at"

    @admin.display(description="Participants")
    def participant_count(self, obj):
        return obj.participants.count()

    @admin.display(description="Messages")
    def message_count(self, obj):
        return obj.messages.count()

    def has_delete_permission(self, request, obj=None):
        # The one exception in this file - see the module docstring. Skips
        # NoEdit's blanket False and falls back to the normal permission check.
        return admin.ModelAdmin.has_delete_permission(self, request, obj)


@admin.register(Participant)
class ParticipantAdmin(NoEdit, admin.ModelAdmin):
    list_display = ("id", "participant", "conversation", "joined_at",
                    "last_read_message_id", "last_read_at", "is_active", "is_muted")
    list_filter = ("is_active", "is_muted")
    search_fields = ("participant__profile_id", "conversation__public_id")
    list_select_related = ("participant", "conversation")


@admin.register(Message)
class MessageAdmin(NoEdit, admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "kind", "preview",
                    "created_at", "edited_at", "deleted_at")
    list_filter = ("kind",)
    search_fields = ("body", "sender__profile_id", "conversation__public_id")
    list_select_related = ("conversation", "sender")
    date_hierarchy = "created_at"

    @admin.display(description="Body")
    def preview(self, obj):
        return obj.body[:80] + ("..." if len(obj.body) > 80 else "")
