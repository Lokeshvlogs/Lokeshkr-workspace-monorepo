"""Everything this app needs to know about the project it is installed in.

This file is the entire seam. Nothing else in `apps.messaging` reads Django
settings, and nothing anywhere in it imports from the host application - so the
directory can be copied into another project, pointed at a different model, and
it works.

Every hook has a working default, which means the app also runs in a bare
Django project with no `MESSAGING_*` settings at all. That is deliberate: a
reusable component whose defaults do not run is not reusable, it is a template.
"""

from django.conf import settings
from django.utils.module_loading import import_string


def _load(setting_name: str, fallback):
    """Resolve a dotted path from settings, or fall back to a local default."""
    path = getattr(settings, setting_name, None)
    return import_string(path) if path else fallback


def _default_resolver(request):
    """Who is talking, given a request. By default, the authenticated user."""
    return getattr(request, "user", None)


def _default_card(participant, request=None):
    """How a participant appears in a conversation header.

    Deliberately ignorant: this app must not know that a host's participant has
    a first name or a display picture.
    """
    return {"id": participant.pk, "label": str(participant)}


def _always_true(*args, **kwargs):
    return True


#: Which model can take part in a conversation. A string, resolved lazily by
#: the app registry, exactly like `AUTH_USER_MODEL` and like the
#: "catalog.Employer" style FKs the host already uses.
PARTICIPANT_MODEL = getattr(
    settings, "MESSAGING_PARTICIPANT_MODEL", settings.AUTH_USER_MODEL
)

#: request -> participant. The app cannot know that a host hangs a Profile off
#: `request.user`; the host says so here.
participant_for_request = _load("MESSAGING_PARTICIPANT_RESOLVER", _default_resolver)

#: participant -> JSON for the conversation header.
serialize_participant = _load("MESSAGING_PARTICIPANT_SERIALIZER", _default_card)

#: The only reason a matrimonial rule ("there must be an accepted interest")
#: does not live in this app. Both default to True, so an installation with no
#: gating simply works.
can_start_conversation = _load("MESSAGING_CAN_START", _always_true)
can_post_message = _load("MESSAGING_CAN_POST", _always_true)

#: Authentication class as a dotted path, so the host can supply its own -
#: Vivah4U passes a JWT class that also stamps presence - without this app
#: importing it.
_auth_path = getattr(settings, "MESSAGING_AUTH", "ninja_jwt.authentication.JWTAuth")
auth = import_string(_auth_path)()

MAX_BODY_LENGTH = getattr(settings, "MESSAGING_MAX_BODY_LENGTH", 4000)
PAGE_SIZE = getattr(settings, "MESSAGING_PAGE_SIZE", 30)
