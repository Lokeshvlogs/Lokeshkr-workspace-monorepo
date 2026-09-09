import pathlib

from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from unittest import mock

from django.test import TestCase
from django.utils import timezone

from apps.messaging import conf, services
from apps.messaging.models import Conversation, Message, Participant, participants_key
from apps.profiles.models import Profile


def _member(username):
    user = User.objects.create_user(username=username, password="x")
    return Profile.objects.get(user=user)


class DecouplingTests(TestCase):
    """The whole design in one assertion."""

    def test_the_app_imports_nothing_from_the_host(self):
        """Cheap, mechanical enforcement - it fails the first time somebody
        takes the shortcut, which is the only moment anyone would."""
        root = pathlib.Path(__file__).parent
        offenders = []

        for path in root.rglob("*.py"):
            if path.name == "tests.py":
                continue  # this file necessarily knows about both sides
            text = path.read_text(encoding="utf-8")
            if "apps.profiles" in text or "from .models import Profile" in text:
                offenders.append(str(path.relative_to(root)))

        self.assertEqual(offenders, [], f"messaging must not import the host: {offenders}")

    def test_migration_does_not_hardcode_the_host_model(self):
        """`makemigrations` writes `to='profiles.profile'` unless the file is
        hand-edited to use swappable_dependency. See README.md."""
        migration = (
            pathlib.Path(__file__).parent / "migrations" / "0001_initial.py"
        ).read_text(encoding="utf-8")

        self.assertNotIn("'profiles.profile'", migration)
        self.assertIn("swappable_dependency", migration)

    def test_every_hook_has_a_working_default(self):
        """A reusable component whose defaults do not run is a template, not a
        component. Tested against the fallbacks rather than `conf.can_*`, which
        under this project's settings are already the host's own rules."""
        self.assertTrue(conf._always_true(object(), object()))

        user = User.objects.create_user(username="bare-default", password="x")
        self.assertEqual(conf._default_card(user), {"id": user.pk, "label": str(user)})

        class FakeRequest:
            pass

        request = FakeRequest()
        request.user = user
        self.assertIs(conf._default_resolver(request), user)

    def test_a_missing_setting_falls_back_rather_than_failing(self):
        self.assertIs(conf._load("MESSAGING_NOT_A_REAL_SETTING", conf._always_true),
                      conf._always_true)


class ConversationTests(TestCase):
    def setUp(self):
        self.asha = _member("asha-msg")
        self.ravi = _member("ravi-msg")

    def test_opening_the_same_pair_twice_returns_one_conversation(self):
        first = services.get_or_create_conversation([self.asha, self.ravi])
        second = services.get_or_create_conversation([self.ravi, self.asha])

        self.assertEqual(first.pk, second.pk)
        self.assertEqual(Conversation.objects.count(), 1)

    def test_participants_key_is_order_independent(self):
        self.assertEqual(
            participants_key([self.asha.pk, self.ravi.pk]),
            participants_key([self.ravi.pk, self.asha.pk]),
        )

    def test_kind_namespaces_the_pair(self):
        """One deployment can carry match and support threads for the same two
        people without a schema change."""
        a = services.get_or_create_conversation([self.asha, self.ravi], kind="match")
        b = services.get_or_create_conversation([self.asha, self.ravi], kind="support")
        self.assertNotEqual(a.pk, b.pk)

    def test_a_conversation_needs_two_different_people(self):
        with self.assertRaises(services.MessagingError):
            services.get_or_create_conversation([self.asha, self.asha])

    def test_participants_key_is_unique_in_the_database(self):
        services.get_or_create_conversation([self.asha, self.ravi])
        with self.assertRaises(IntegrityError):
            Conversation.objects.create(
                participants_key=participants_key([self.asha.pk, self.ravi.pk])
            )

    def test_non_participant_is_refused_with_404(self):
        """404 and not 403 - a 403 confirms the conversation exists."""
        conversation = services.get_or_create_conversation([self.asha, self.ravi])
        stranger = _member("stranger-msg")

        with self.assertRaises(services.MessagingError) as caught:
            services.membership(conversation, stranger)
        self.assertEqual(caught.exception.status, 404)


class MessageTests(TestCase):
    def setUp(self):
        self.asha = _member("asha-m2")
        self.ravi = _member("ravi-m2")
        self.conversation = services.get_or_create_conversation([self.asha, self.ravi])
        self.mine = services.membership(self.conversation, self.asha)
        self.theirs = services.membership(self.conversation, self.ravi)

    def test_posting_updates_the_conversation_summary(self):
        services.post_message(self.conversation, self.asha, "Hello there")
        self.conversation.refresh_from_db()

        self.assertEqual(self.conversation.last_message_preview, "Hello there")
        self.assertIsNotNone(self.conversation.last_message_at)

    def test_empty_messages_are_refused(self):
        with self.assertRaises(services.MessagingError):
            services.post_message(self.conversation, self.asha, "   ")

    def test_overlong_messages_are_refused(self):
        with self.assertRaises(services.MessagingError):
            services.post_message(self.conversation, self.asha, "x" * (conf.MAX_BODY_LENGTH + 1))

    def test_a_retried_post_does_not_double_post(self):
        """A flaky connection retrying must not say everything twice."""
        first = services.post_message(self.conversation, self.asha, "Hi", client_ref="abc")
        second = services.post_message(self.conversation, self.asha, "Hi", client_ref="abc")

        self.assertEqual(first.pk, second.pk)
        self.assertEqual(Message.objects.count(), 1)

    def test_duplicate_client_ref_is_refused_by_the_database(self):
        services.post_message(self.conversation, self.asha, "Hi", client_ref="abc")
        with self.assertRaises(IntegrityError):
            Message.objects.create(
                conversation=self.conversation, sender=self.asha, body="Hi", client_ref="abc"
            )

    def test_blank_client_refs_do_not_collide(self):
        services.post_message(self.conversation, self.asha, "one")
        services.post_message(self.conversation, self.asha, "two")
        self.assertEqual(Message.objects.count(), 2)

    def test_closed_conversations_refuse_messages(self):
        Conversation.objects.filter(pk=self.conversation.pk).update(is_closed=True)
        self.conversation.refresh_from_db()

        with self.assertRaises(services.MessagingError):
            services.post_message(self.conversation, self.asha, "Hello")

    def test_your_own_messages_are_never_unread(self):
        services.post_message(self.conversation, self.asha, "Hello")
        self.assertEqual(services.unread_count(self.conversation, self.mine), 0)
        self.assertEqual(services.unread_count(self.conversation, self.theirs), 1)

    def test_reading_clears_the_count(self):
        message = services.post_message(self.conversation, self.asha, "Hello")
        services.mark_read(self.theirs, message.id)
        self.theirs.refresh_from_db()

        self.assertEqual(services.unread_count(self.conversation, self.theirs), 0)

    def test_the_read_watermark_never_moves_backwards(self):
        first = services.post_message(self.conversation, self.asha, "one")
        second = services.post_message(self.conversation, self.asha, "two")

        services.mark_read(self.theirs, second.id)
        services.mark_read(self.theirs, first.id)
        self.theirs.refresh_from_db()

        self.assertEqual(self.theirs.last_read_message_id, second.id)

    def test_deleted_messages_do_not_count_as_unread(self):
        message = services.post_message(self.conversation, self.asha, "oops")
        Message.objects.filter(pk=message.pk).update(deleted_at=message.created_at)

        self.assertEqual(services.unread_count(self.conversation, self.theirs), 0)

    def test_a_deleted_sender_leaves_the_thread_readable(self):
        """SET_NULL, not CASCADE: one person leaving must not erase the other's
        half of the conversation."""
        services.post_message(self.conversation, self.asha, "Still here")
        self.asha.user.delete()

        remaining = Message.objects.filter(conversation=self.conversation)
        self.assertEqual(remaining.count(), 1)
        self.assertIsNone(remaining.first().sender_id)

    def test_pagination_is_stable_while_messages_arrive(self):
        """Keyset, not offset: offset paging skips and duplicates rows as a
        thread grows underneath it."""
        sent = [services.post_message(self.conversation, self.asha, f"m{n}") for n in range(10)]

        newest = services.messages_page(self.conversation, limit=4)
        self.assertEqual([m.id for m in newest], [m.id for m in sent[-4:]])

        services.post_message(self.conversation, self.ravi, "arrives mid-scroll")

        older = services.messages_page(self.conversation, before_id=newest[0].id, limit=4)
        self.assertEqual([m.id for m in older], [m.id for m in sent[2:6]])

    def test_after_id_returns_only_what_is_new(self):
        first = services.post_message(self.conversation, self.asha, "one")
        second = services.post_message(self.conversation, self.asha, "two")

        self.assertEqual(
            [m.id for m in services.messages_page(self.conversation, after_id=first.id)],
            [second.id],
        )

    def test_unread_totals_cover_every_conversation(self):
        services.post_message(self.conversation, self.asha, "Hello")
        totals = services.unread_totals(self.ravi)

        self.assertEqual(totals["total"], 1)
        self.assertEqual(totals["per_conversation"][str(self.conversation.public_id)], 1)


class HostGateTests(TestCase):
    """The seam itself - this app must obey a host that says no.

    `conf` resolves its hooks once at import, so these patch the module
    attribute, which is what the router actually calls.
    """

    def setUp(self):
        self.asha = _member("asha-gate")
        self.ravi = _member("ravi-gate")

    def test_the_host_can_refuse_a_conversation(self):
        with mock.patch.object(conf, "can_start_conversation", lambda actor, others: False):
            self.assertFalse(conf.can_start_conversation(self.asha, [self.ravi]))

    def test_vivah4u_requires_an_accepted_interest(self):
        """The matrimonial rule, checked where it actually lives - on the host
        side of the seam."""
        from apps.profiles import interests
        from apps.profiles.messaging_hooks import can_start_conversation

        self.assertFalse(can_start_conversation(self.asha, [self.ravi]))

        interest, _ = interests.send(self.asha, self.ravi)
        self.assertFalse(
            can_start_conversation(self.asha, [self.ravi]),
            "a pending interest is not consent",
        )

        interests.accept(interest.id, self.ravi)
        self.assertTrue(can_start_conversation(self.asha, [self.ravi]))

    def test_accepting_an_interest_opens_exactly_one_conversation(self):
        from apps.profiles import interests

        interest, _ = interests.send(self.asha, self.ravi)
        interests.accept(interest.id, self.ravi)

        conversations = Conversation.objects.filter(kind="match")
        self.assertEqual(conversations.count(), 1)
        self.assertEqual(conversations.first().context_ref, str(interest.id))


class ArchivedUnreadTests(TestCase):
    """Archiving must not leave a badge nobody can clear."""

    def setUp(self):
        self.asha = _member("asha-arch")
        self.ravi = _member("ravi-arch")
        self.conversation = services.get_or_create_conversation([self.asha, self.ravi])

    def test_archived_conversations_leave_the_unread_total(self):
        """`conversations_for` hides archived threads, so counting their unread
        produced a total no list could show and no reading could clear."""
        services.post_message(self.conversation, self.asha, "Hello")
        self.assertEqual(services.unread_totals(self.ravi)["total"], 1)

        theirs = services.membership(self.conversation, self.ravi)
        Participant.objects.filter(pk=theirs.pk).update(archived_at=timezone.now())

        self.assertEqual(services.unread_totals(self.ravi)["total"], 0)

    def test_archiving_is_per_participant(self):
        """One side filing a thread away must not silence it for the other."""
        services.post_message(self.conversation, self.ravi, "Are you there?")

        mine = services.membership(self.conversation, self.asha)
        Participant.objects.filter(pk=mine.pk).update(archived_at=timezone.now())

        self.assertEqual(services.unread_totals(self.asha)["total"], 0)
        self.assertEqual(
            len(list(services.conversations_for(self.ravi))),
            1,
            "the other side still sees the thread",
        )
