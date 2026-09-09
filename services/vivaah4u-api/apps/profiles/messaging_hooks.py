"""The only module that knows about both `profiles` and `messaging`.

The dependency arrow points host -> module and never back. `apps.messaging` has
an authorisation *seam*; the matrimonial rule that fills it lives here, so
dropping that app into another project does not drag this rule along with it.
"""

from . import cards, interests
from .models import Profile


def participant_for_request(request):
    """Vivah4U talks as a Profile, not as the auth User behind it."""
    return Profile.objects.filter(user=request.user).first()


def participant_card(profile: Profile, request=None):
    """How the other person appears in a conversation header.

    Reuses the same card the visitor list and the interests inbox render, so a
    person looks the same everywhere in the product.
    """
    return cards.person_card(profile, request, viewer=profile)


def can_start_conversation(actor: Profile, others) -> bool:
    """The gate: a conversation needs a mutually accepted interest.

    This is the whole reason the messaging app is generic. Another project
    installs it and gets no such rule.
    """
    return all(interests.is_accepted_between(actor, other) for other in others)


def can_post_message(actor: Profile, conversation) -> bool:
    """Checked per message, not only at the start.

    An interest that is later withdrawn or blocked should close the thread off,
    and gating only on creation would leave it open forever.
    """
    from apps.messaging.models import Participant

    others = (
        Participant.objects.filter(conversation=conversation)
        .exclude(participant_id=actor.pk)
        .select_related("participant")
    )
    return not conversation.is_closed and all(
        interests.is_accepted_between(actor, row.participant) for row in others
    )
