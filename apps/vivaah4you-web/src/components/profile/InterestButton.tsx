'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Clock, MessageCircle, XCircle } from 'lucide-react'

import { interestLabel, useInterest } from '@/hooks/useInterest'
import { useMessenger } from '@/components/messenger/MessengerProvider'
import type { ConnectionState } from '@/lib/interests'

interface Props {
  profileId: string
  /** Match cards need a smaller, full-width version of the same button. */
  variant?: 'primary' | 'card'
  /**
   * Where the viewer already stands with this member, from the server.
   *
   * Absent means "no interest either way", which is not the same as unknown -
   * the grid and the profile page both read `/api/interests/states` before
   * they render. Without it this button started every page load at "Connect",
   * including on a profile whose interest had already been accepted.
   */
  connection?: ConnectionState
  className?: string
}

/**
 * The one control that says what to do next with a member.
 *
 * Four outcomes, because an interest is not a boolean: nothing yet (Connect),
 * waiting on them (Pending), waiting on you (Respond), settled one way
 * (Chat) or the other (Declined). One component so the card, the match profile
 * and the public profile cannot drift - which is why it was made shared, back
 * when all three had a button with no onClick at all.
 */
export default function InterestButton({
  profileId,
  variant = 'primary',
  connection,
  className = '',
}: Props) {
  const { state, error, send, busy } = useInterest()
  const { openDrawer } = useMessenger()
  const [opening, setOpening] = useState(false)
  const [chatError, setChatError] = useState('')

  const base = variant === 'card' ? 'card-cta' : 'btn bg-color-primary text-white'

  /* The server's answer, unless this button has since changed it - sending an
     interest in this session beats a state fetched before it was sent. */
  const status = state === 'mutual' ? 'accepted' : state === 'sent' ? 'pending' : connection?.status
  const direction = state === 'sent' || state === 'mutual' ? 'sent' : connection?.direction

  const openChat = async () => {
    setOpening(true)
    setChatError('')
    try {
      const response = await fetch(`/api/interests/conversation/${encodeURIComponent(profileId)}`, {
        method: 'POST',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.id) {
        setChatError('Could not open this chat.')
        return
      }
      // The drawer is hoisted in the root layout and already takes a thread id,
      // so this opens on the right conversation without a navigation.
      openDrawer(String(data.id))
    } catch {
      setChatError('Network error. Please try again.')
    } finally {
      setOpening(false)
    }
  }

  if (status === 'accepted') {
    return (
      <span className="interest-action">
        <button
          type="button"
          onClick={openChat}
          disabled={opening}
          className={`${base} ${className}`}
        >
          <MessageCircle className="card-cta-icon" strokeWidth={2} aria-hidden="true" />
          {opening ? 'Opening…' : 'Chat'}
        </button>
        {chatError && <span className="interest-error">{chatError}</span>}
      </span>
    )
  }

  if (status === 'pending' && direction === 'received') {
    // Their move landed in the inbox, which is the only place it can be
    // answered - accepting from a card would hide the message they sent with it.
    return (
      <Link href="/interests" className={`${base} card-cta-respond ${className}`}>
        Respond
      </Link>
    )
  }

  if (status === 'pending') {
    return (
      <span className="interest-action">
        <button type="button" disabled className={`${base} card-cta-quiet ${className}`}>
          <Clock className="card-cta-icon" strokeWidth={2} aria-hidden="true" />
          Pending
        </button>
      </span>
    )
  }

  if (status === 'declined' || status === 'withdrawn') {
    return (
      <span className="interest-action">
        <button type="button" disabled className={`${base} card-cta-quiet ${className}`}>
          <XCircle className="card-cta-icon" strokeWidth={2} aria-hidden="true" />
          {status === 'declined' ? 'Declined' : 'Withdrawn'}
        </button>
      </span>
    )
  }

  return (
    <span className="interest-action">
      <button
        type="button"
        disabled={busy}
        onClick={() => send(profileId)}
        className={`${base} ${className}`}
      >
        {interestLabel(state)}
      </button>
      {error && <span className="interest-error">{error}</span>}
    </span>
  )
}
