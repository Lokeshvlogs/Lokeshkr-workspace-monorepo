# apps.messaging

Conversations, participants and messages. Written to be lifted into another
Django project with a config change rather than a rewrite.

**It imports nothing from the host application.** `tests.py` enforces that
mechanically by reading every `.py` in this directory — if someone takes the
shortcut, the suite says so.

## Reusing it elsewhere

1. Copy the directory.
2. Add `'apps.messaging'` to `INSTALLED_APPS`.
3. Set `MESSAGING_PARTICIPANT_MODEL` (defaults to `AUTH_USER_MODEL`).
4. Write a hooks module with as many of the four functions below as you care
   about. All are optional.
5. **Re-do the migration edit** — see the warning below.
6. `api.add_router("/messaging/", messaging_router)`.
7. `manage.py migrate`.

Steps 3 and 4 are optional. With no settings at all, the app talks in terms of
`AUTH_USER_MODEL`, labels people with `str()`, and lets anyone message anyone.

## The settings

| Setting | Default | What it does |
|---|---|---|
| `MESSAGING_PARTICIPANT_MODEL` | `AUTH_USER_MODEL` | Which model can take part |
| `MESSAGING_PARTICIPANT_RESOLVER` | `request.user` | request → participant |
| `MESSAGING_PARTICIPANT_SERIALIZER` | `{id, label}` | participant → JSON |
| `MESSAGING_CAN_START` | always true | May these people open a thread? |
| `MESSAGING_CAN_POST` | always true | May this person post here? |
| `MESSAGING_AUTH` | `ninja_jwt…JWTAuth` | Authentication class |
| `MESSAGING_MAX_BODY_LENGTH` | 4000 | |
| `MESSAGING_PAGE_SIZE` | 30 | |

`CAN_START` and `CAN_POST` are the whole reason this app is generic. Vivah4U
requires a mutually accepted interest before two people may talk; that rule
lives in `apps/profiles/messaging_hooks.py`, on the host side of the seam, and
does not travel with this directory.

## ⚠ The migration edit

`makemigrations` **resolves** `MESSAGING_PARTICIPANT_MODEL` and writes the
concrete model into the migration:

```python
dependencies = [('profiles', '0028_…')]          # the host, hardcoded
to='profiles.profile'                             # the host, hardcoded
```

That defeats the point. Django avoids it for `AUTH_USER_MODEL` only because
`auth.User` declares `swappable` in its `Meta`; a third-party setting gets no
such treatment.

After generating, replace them by hand:

```python
dependencies = [migrations.swappable_dependency(settings.MESSAGING_PARTICIPANT_MODEL)]
to=settings.MESSAGING_PARTICIPANT_MODEL
```

`0001_initial.py` already carries this edit and a note saying so. **This is the
step most likely to be skipped, and skipping it is invisible until somebody
tries to reuse the app.**

## Design notes

- **Read state is a watermark** (`Participant.last_read_message_id`), not a row
  per (message, reader). A thread only ever asks "how many since I last looked"
  and "have they seen mine"; a watermark answers both with one `UPDATE` and one
  `COUNT`. It cannot express reading out of order — no UI here does.
- **Pagination is keyset, not offset.** Offset paging on a growing thread skips
  and duplicates rows as messages arrive.
- **`Message.client_ref`** is a client-generated idempotency key with a partial
  unique, so a retried POST on a flaky connection cannot double-post.
- **`Message.sender` is `SET_NULL`**, never `CASCADE` — deleting an account
  must not erase the other person's half of the conversation.
- **`Conversation.participants_key`** is unique, so opening a chat is idempotent
  at the database level rather than a race that can land two threads.
- **`related_name="+"` on every participant FK.** A reusable app must not bolt
  accessors onto the host's model, or a second such app collides.
- **A non-participant gets 404, not 403** — a 403 confirms the thread exists.
- **No realtime transport.** The stack is WSGI + django-ninja with no channels
  or socket layer, and SSE on WSGI holds a worker thread per client. `/poll` is
  therefore the cheapest possible endpoint and every client reads through it, so
  moving to SSE or Channels later is one endpoint and one hook.
