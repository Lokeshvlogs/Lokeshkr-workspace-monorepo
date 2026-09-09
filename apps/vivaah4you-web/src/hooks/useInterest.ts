'use client'

import { useCallback, useState } from 'react'

export type InterestState = 'idle' | 'sending' | 'sent' | 'mutual' | 'error'

/**
 * Sending an interest from a profile or a card.
 *
 * State is local rather than global: the buttons that use this are scattered
 * across three components with no shared parent, and every one of them only
 * cares about the single profile it is rendering. The inbox refetches from the
 * server, so nothing here needs to be authoritative.
 */
export function useInterest() {
  const [state, setState] = useState<InterestState>('idle')
  const [error, setError] = useState('')

  const send = useCallback(async (profileId: string, message = '') => {
    if (!profileId) return false

    setState('sending')
    setError('')

    try {
      const response = await fetch(`/api/interests/send/${encodeURIComponent(profileId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setState('error')
        setError(data?.detail ?? 'Could not send this right now.')
        return false
      }

      // A crossing interest accepts on the spot, and saying so is the whole
      // point - "sent" would undersell what just happened.
      setState(data?.mutual ? 'mutual' : 'sent')
      return true
    } catch {
      setState('error')
      setError('Network error. Please try again.')
      return false
    }
  }, [])

  return { state, error, send, busy: state === 'sending' }
}

/** The button label for a given state, so the three call sites agree. */
export function interestLabel(state: InterestState): string {
  switch (state) {
    case 'sending':
      return 'Sending…'
    case 'sent':
      return 'Interest sent'
    case 'mutual':
      return "It's mutual!"
    default:
      return 'Express interest'
  }
}
