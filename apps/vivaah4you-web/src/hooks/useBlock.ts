'use client'

import { useCallback, useState } from 'react'

import { detailMessage } from '@/lib/errors'

/**
 * Blocking and unblocking one member.
 *
 * NOT optimistic, unlike `useSaved`. A save that fails and quietly reverts
 * costs a bookmark; a block that appears to have landed and has not leaves
 * somebody believing they are out of contact with a person who is not. This
 * waits for the server and reports what actually happened.
 */
export function useBlock() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const call = useCallback(async (profileId: string, method: 'POST' | 'DELETE') => {
    if (!profileId) return false

    setBusy(true)
    setError('')

    try {
      const response = await fetch(`/api/profile/blocks/${encodeURIComponent(profileId)}`, {
        method,
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(detailMessage(data, 'Could not do that right now.'))
        return false
      }
      return true
    } catch {
      setError('Network error. Please try again.')
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  const block = useCallback((profileId: string) => call(profileId, 'POST'), [call])
  const unblock = useCallback((profileId: string) => call(profileId, 'DELETE'), [call])

  return { block, unblock, busy, error }
}
