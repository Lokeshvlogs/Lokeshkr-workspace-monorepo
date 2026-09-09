/**
 * Whether a member is around, from the `presence` block the API sends.
 *
 * The server decides what a viewer is allowed to know - an anonymous reader
 * gets no block at all, and for anyone but yourself the timestamp is floored to
 * the hour. This file only turns what arrived into something to render.
 */

/** "3 days ago" from an ISO timestamp, without pulling in a date library. */
export function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.round(days / 30)}mo ago`
}

/** The `presence` block as the API sends it. Absent for anonymous readers. */
export interface PresenceBlock {
  isOnline: boolean
  /** Null while they are online - "online now" is the whole message. */
  lastActiveAt: string | null
}

export interface Presence {
  online: boolean
  /** Empty when there is nothing honest to say - render nothing at all. */
  label: string
}

/**
 * A profile that has never been stamped returns an empty label rather than
 * "offline". Every profile predating the column is null, and calling those
 * members offline would be a claim the data does not support.
 */
export function presenceFor(presence: PresenceBlock | null | undefined): Presence {
  if (!presence) return { online: false, label: '' }
  if (presence.isOnline) return { online: true, label: 'Online now' }

  const ago = relativeTime(presence.lastActiveAt)
  return { online: false, label: ago ? `Last seen ${ago}` : '' }
}
