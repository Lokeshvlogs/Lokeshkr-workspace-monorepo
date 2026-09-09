'use client'

import React from 'react'

import { interestLabel, useInterest } from '@/hooks/useInterest'

interface Props {
  profileId: string
  /** Match cards need a smaller, full-width version of the same button. */
  variant?: 'primary' | 'card'
  className?: string
}

/**
 * "Express interest", wired.
 *
 * Three copies of this button existed with no `onClick` at all - on the match
 * card, the match profile and the public profile page - beside copy promising
 * that contact details are shared once both sides express interest. One
 * component now backs all three so they cannot drift again.
 */
export default function InterestButton({ profileId, variant = 'primary', className = '' }: Props) {
  const { state, error, send, busy } = useInterest()
  const done = state === 'sent' || state === 'mutual'

  const base =
    variant === 'card'
      ? 'card-cta'
      : 'btn bg-color-primary text-white'

  return (
    <span className="interest-action">
      <button
        type="button"
        // Disabled once it has landed rather than hidden: the member needs to
        // see that their tap registered.
        disabled={busy || done}
        onClick={() => send(profileId)}
        className={`${base} ${done ? 'interest-done' : ''} ${className}`}
      >
        {interestLabel(state)}
      </button>
      {error && <span className="interest-error">{error}</span>}
    </span>
  )
}
