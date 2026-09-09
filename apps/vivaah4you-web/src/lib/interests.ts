import type { PresenceBlock } from '@/lib/presence'

export const INTEREST_TABS = ['received', 'sent', 'accepted', 'declined'] as const
export type InterestTab = (typeof INTEREST_TABS)[number]

export type InterestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn'

/** The other person in an interest, as a list row. */
export interface InterestPerson {
  profileId: string
  name: string
  age: number | null
  city: string
  photo: string | null
  verificationLevel: number
  presence: PresenceBlock | null
}

export interface InterestRow {
  id: number
  status: InterestStatus
  /** Whose move it was. "received" is a point of view, not a status. */
  direction: 'sent' | 'received'
  createdAt: string
  respondedAt: string | null
  message: string
  /** Received and not yet opened. Drives the dot, not the tab count. */
  isNew: boolean
  profile: InterestPerson
}

export interface InterestCounts {
  receivedPending: number
  receivedUnseen: number
  sentPending: number
  accepted: number
  declined: number
}

export const EMPTY_COUNTS: InterestCounts = {
  receivedPending: 0,
  receivedUnseen: 0,
  sentPending: 0,
  accepted: 0,
  declined: 0,
}

/**
 * Django snake_case to the browser's camelCase.
 *
 * Lives here rather than inline in the route handler so the two handlers that
 * return rows cannot drift apart, and so the shape is stated once.
 */
export function toInterestRow(raw: any): InterestRow {
  const person = raw?.profile ?? {}
  return {
    id: Number(raw?.id ?? 0),
    status: (raw?.status ?? 'pending') as InterestStatus,
    direction: raw?.direction === 'sent' ? 'sent' : 'received',
    createdAt: String(raw?.created_at ?? ''),
    respondedAt: raw?.responded_at ?? null,
    message: String(raw?.message ?? ''),
    isNew: Boolean(raw?.is_new),
    profile: {
      profileId: String(person.profile_id ?? ''),
      name: [person.first_name, person.surname].filter(Boolean).join(' ').trim(),
      age: person.age ?? null,
      city: String(person.city ?? ''),
      photo: person.photo ?? null,
      verificationLevel: Number(person.verification_level ?? 0),
      presence: person.presence ?? null,
    },
  }
}

export function toInterestCounts(raw: any): InterestCounts {
  return {
    receivedPending: Number(raw?.received_pending ?? 0),
    receivedUnseen: Number(raw?.received_unseen ?? 0),
    sentPending: Number(raw?.sent_pending ?? 0),
    accepted: Number(raw?.accepted ?? 0),
    declined: Number(raw?.declined ?? 0),
  }
}

export const TAB_LABEL: Record<InterestTab, string> = {
  received: 'Received',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
}
