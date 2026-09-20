'use client'

import React from 'react'
import { Bookmark } from 'lucide-react'

import { useSaved } from '@/hooks/useSaved'

interface Props {
  profileId: string
  /** The server's answer at page load; the toggle takes over from there. */
  initialSaved?: boolean
  className?: string
}

/**
 * The quiet half of the card's action row.
 *
 * A bookmark rather than a heart: saving here is private and says nothing to
 * the other member, which is exactly the distinction the Connect button beside
 * it needs to keep. The word is kept next to the glyph - a lone bookmark on a
 * matrimony card reads as "shortlisted, and they were told".
 */
export default function SaveButton({ profileId, initialSaved = false, className = '' }: Props) {
  const { saved, busy, toggle } = useSaved(initialSaved)

  return (
    <button
      type="button"
      onClick={() => toggle(profileId)}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save this profile'}
      className={`card-save ${saved ? 'card-save-on' : ''} ${className}`}
    >
      {/* One glyph in both states. Saved fills it from CSS rather than
          swapping in a second icon, so the bookmark does not change shape
          under the finger that just tapped it. */}
      <Bookmark className="card-save-icon" strokeWidth={1.9} aria-hidden="true" />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
