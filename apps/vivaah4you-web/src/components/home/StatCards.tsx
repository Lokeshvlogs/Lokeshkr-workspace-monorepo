'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import { useMessenger } from '@/components/messenger/MessengerProvider'
import type { MemberStats } from '@/types/stats'

interface Props {
  stats: MemberStats | null
  loading: boolean
}

/**
 * A number that counts up to its value on first paint.
 *
 * The whole point of the strip is that these are live figures rather than a
 * report; arriving at rest makes them look printed. Skipped entirely under
 * `prefers-reduced-motion`, where the final value appears at once.
 */
function Counter({ value }: { value: number }) {
  const [shown, setShown] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const from = previous.current
    previous.current = value

    if (reduced || from === value || value > 999) {
      setShown(value)
      return
    }

    const start = performance.now()
    const span = 650
    let frame = 0

    const step = (now: number) => {
      const t = Math.min((now - start) / span, 1)
      // Ease-out: fast at first, settling into the number.
      const eased = 1 - (1 - t) ** 3
      setShown(Math.round(from + (value - from) * eased))
      if (t < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <>{shown}</>
}

interface PillProps {
  value: number
  label: string
  /** A count of what is new. Rendered as a dot, not a number. */
  fresh?: boolean
  href?: string
  onClick?: () => void
  glyph: React.ReactNode
}

function StatPill({ value, label, fresh, href, onClick, glyph }: PillProps) {
  const body = (
    <>
      <span className="pill-glyph" aria-hidden="true">
        {glyph}
      </span>
      <span className="pill-value">
        <Counter value={value} />
      </span>
      <span className="pill-label">{label}</span>
      {fresh && <span className="pill-dot" aria-label="New" />}
    </>
  )

  // A button when it opens a panel, so it does not promise a navigation it
  // never makes and ctrl-click cannot open a dead tab.
  if (!href) {
    return (
      <button type="button" onClick={onClick} aria-haspopup="dialog" className="pill">
        {body}
      </button>
    )
  }

  return (
    <Link href={href} className="pill">
      {body}
    </Link>
  )
}

const GLYPH = {
  matches: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 12 5.5 5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  ),
  interests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v12H5.2L4 17.5Z" />
      <path d="m8 9 2.5 2.5L16 7" />
    </svg>
  ),
  visitors: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-2.8-.4L3 21l1.5-4.6A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </svg>
  ),
}

/**
 * The figures worth acting on, as one light strip.
 *
 * These were four large boxes filling the top of the page, which read as a
 * back-office summary screen rather than somewhere you came to meet people.
 * The matches are the page now; this sits above them as a row of pills you can
 * glance past.
 */
export default function StatCards({ stats, loading }: Props) {
  const { openDrawer, unreadTotal } = useMessenger()

  if (loading || !stats) {
    return (
      <div className="pills" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="pill pill-loading" />
        ))}
      </div>
    )
  }

  return (
    <div className="pills">
      <StatPill glyph={GLYPH.matches} value={stats.matches} label="matches" href="/matches" />
      <StatPill
        glyph={GLYPH.interests}
        value={stats.interestsReceived}
        label="interests"
        fresh={stats.interestsUnseen > 0}
        href="/interests"
      />
      <StatPill
        glyph={GLYPH.visitors}
        value={stats.uniqueVisitors}
        label="visitors"
        href="/visitors"
      />
      <StatPill
        glyph={GLYPH.messages}
        value={unreadTotal}
        label="unread"
        onClick={() => openDrawer()}
      />
      <StatPill glyph={GLYPH.activity} value={stats.profileViews} label="views" href="/activity" />
    </div>
  )
}
