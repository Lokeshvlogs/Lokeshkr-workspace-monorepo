'use client'

import React from 'react'
import Link from 'next/link'

import { useMessenger } from '@/components/messenger/MessengerProvider'
import type { MemberStats } from '@/types/stats'

interface Props {
  stats: MemberStats | null
  loading: boolean
}

interface CardProps {
  value: number
  label: string
  hint?: string
  /** A count of what is new, shown as a pill on the card. */
  badge?: number
  /** Some of it is unseen - a dot, separate from the badge. */
  dot?: boolean
  /** A destination. Omit and pass `onClick` for a card that opens a panel. */
  href?: string
  onClick?: () => void
  tone: 'matches' | 'interests' | 'visitors' | 'messages'
  icon: React.ReactNode
}

function StatCard({ value, label, hint, badge, dot, href, onClick, tone, icon }: CardProps) {
  const body = (
    <>
      <span className="stat-card-top">
        <span className="stat-card-icon" aria-hidden="true">
          {icon}
        </span>
        {Boolean(badge) && <span className="stat-card-badge">+{badge} new</span>}
        {dot && <span className="stat-card-dot" aria-label="Unseen" />}
      </span>

      <span className="stat-card-value">{value}</span>
      <span className="stat-card-label">{label}</span>
      {hint && <span className="stat-card-hint">{hint}</span>}
    </>
  )

  // A button, not a link, when it opens the drawer: a link would promise a
  // navigation it never makes, and ctrl-click would open a dead tab.
  if (!href) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-haspopup="dialog"
        className={`stat-card stat-card-${tone} text-left`}
      >
        {body}
      </button>
    )
  }

  return (
    <Link href={href} className={`stat-card stat-card-${tone}`}>
      {body}
    </Link>
  )
}

const ICONS = {
  matches: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 12 5.5 5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  ),
  interests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v12H5.2L4 17.5Z" />
      <path d="m8 9 2.5 2.5L16 7" />
    </svg>
  ),
  visitors: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-2.8-.4L3 21l1.5-4.6A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
    </svg>
  ),
}

/**
 * The four things worth acting on, as destinations rather than figures.
 *
 * The welcome band above used to carry three of these as plain text. A number
 * you cannot click is a report; the point of a dashboard is that every figure
 * is a way in.
 */
export default function StatCards({ stats, loading }: Props) {
  const { openDrawer, unreadTotal } = useMessenger()

  if (loading || !stats) {
    return (
      <div className="stat-cards" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="stat-card stat-card-loading" />
        ))}
      </div>
    )
  }

  return (
    <div className="stat-cards">
      <StatCard
        tone="matches"
        icon={ICONS.matches}
        value={stats.matches}
        label="Matches"
        hint="people you can match with"
        badge={stats.newMatches}
        href="/matches"
      />
      <StatCard
        tone="interests"
        icon={ICONS.interests}
        value={stats.interestsReceived}
        label="Interests"
        hint={
          stats.interestsAccepted > 0
            ? `${stats.interestsAccepted} mutual`
            : 'awaiting your reply'
        }
        dot={stats.interestsUnseen > 0}
        href="/interests"
      />
      <StatCard
        tone="visitors"
        icon={ICONS.visitors}
        value={stats.uniqueVisitors}
        label="Visitors"
        hint={
          stats.repeatVisitors > 0
            ? `${stats.repeatVisitors} came back`
            : `${stats.profileViews} views`
        }
        href="/visitors"
      />
      {/* The odd one out: it opens the drawer rather than navigating. */}
      <StatCard
        tone="messages"
        icon={ICONS.messages}
        value={unreadTotal}
        label="Messages"
        hint={unreadTotal > 0 ? 'unread' : 'open your chats'}
        onClick={() => openDrawer()}
      />
    </div>
  )
}
