/**
 * The messaging UI's view of the world.
 *
 * Deliberately small and free of any product's vocabulary: a participant is an
 * id, a name and optionally a picture, and nothing here knows what those people
 * are to each other. That is what lets these components move to another project
 * alongside `apps/messaging` with a different fetcher behind them.
 */

export interface MessagingPerson {
  id: string
  name: string
  photo?: string | null
  /** Free-form line under the name - "Online now", a city, a role. */
  detail?: string
  online?: boolean
}

export interface MessagingConversation {
  id: string
  others: MessagingPerson[]
  lastMessageAt: string | null
  lastMessagePreview: string
  unreadCount: number
  isClosed: boolean
}

export interface MessagingMessage {
  id: number
  body: string
  isMine: boolean
  createdAt: string
  deleted?: boolean
  /** Present on optimistic rows until the server confirms them. */
  clientRef?: string
  pending?: boolean
  failed?: boolean
}
