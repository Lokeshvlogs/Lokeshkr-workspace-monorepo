'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Saving a profile from a card.
 *
 * Optimistic and local, for the same reason `useInterest` is: the button only
 * ever cares about the one profile it renders, and the grid seeds it with the
 * server's answer on load. A failed call reverts, so the bookmark never claims
 * a save that did not land.
 */
export function useSaved(initial = false) {
  const [saved, setSaved] = useState(initial)
  const [busy, setBusy] = useState(false)

  /* The grid paints cards before the saved-id set has arrived, so `initial`
     lands a moment after mount. Without this the bookmark would sit hollow on
     a profile the member had already saved. It cannot clobber a local toggle:
     the set is read once per sign-in and never rewritten. */
  useEffect(() => {
    setSaved(initial)
  }, [initial])

  const toggle = useCallback(
    async (profileId: string) => {
      if (!profileId || busy) return

      const next = !saved
      setSaved(next)
      setBusy(true)

      try {
        const response = await fetch(`/api/profile/saved/${encodeURIComponent(profileId)}`, {
          method: next ? 'POST' : 'DELETE',
        })
        if (!response.ok) setSaved(!next)
      } catch {
        setSaved(!next)
      } finally {
        setBusy(false)
      }
    },
    [saved, busy],
  )

  return { saved, busy, toggle }
}
