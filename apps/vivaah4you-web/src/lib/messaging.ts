import type { MessagingConversation, MessagingMessage } from '@lokesh-workspace/ui'

import { presenceFor } from '@/lib/presence'

/**
 * Django's snake_case into the shape the UI package expects.
 *
 * This file is the adapter between the two halves of the messaging feature: the
 * reusable Django app on one side, the reusable React components on the other.
 * Everything Vivah4U-specific about how a person is described - the presence
 * line, the joined name - happens here and nowhere else.
 */

export function toConversation(raw: any): MessagingConversation {
  return {
    id: String(raw?.id ?? ''),
    others: (raw?.others ?? []).map((person: any) => {
      const presence = presenceFor(person?.presence)
      return {
        id: String(person?.profile_id ?? person?.id ?? ''),
        name: [person?.first_name, person?.surname].filter(Boolean).join(' ').trim()
          || String(person?.label ?? 'Vivah4U member'),
        photo: person?.photo ?? null,
        detail: [person?.city, presence.label].filter(Boolean).join(' · '),
        online: presence.online,
      }
    }),
    lastMessageAt: raw?.last_message_at ?? null,
    lastMessagePreview: String(raw?.last_message_preview ?? ''),
    unreadCount: Number(raw?.unread_count ?? 0),
    isClosed: Boolean(raw?.is_closed),
  }
}

export function toMessage(raw: any): MessagingMessage {
  return {
    id: Number(raw?.id ?? 0),
    body: String(raw?.body ?? ''),
    isMine: Boolean(raw?.is_mine),
    createdAt: String(raw?.created_at ?? ''),
    deleted: Boolean(raw?.deleted),
    clientRef: raw?.client_ref || undefined,
  }
}

/**
 * A key for one send attempt.
 *
 * Generated per message rather than per retry: it is what lets the server
 * recognise a re-sent POST as the same message instead of posting it twice.
 */
export function newClientRef(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
