'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { VerifiedBadge } from '@lokesh-workspace/ui'

import Avatar from '@/components/profile/Avatar'
import TabStrip, { type TabDef } from '@/components/common/TabStrip'
import { presenceFor, relativeTime, type PresenceBlock } from '@/lib/presence'
import { profileHref } from '@/lib/navigation'
import { useAuth } from '@/components/authProvider'

interface Visitor {
  profileId: string
  name: string
  age: number | null
  city: string
  photo: string | null
  lastSeen: string | null
  verificationLevel?: number
  visits?: number
  isRepeat?: boolean
  presence?: PresenceBlock | null
}

type VisitorTab = 'all' | 'repeat'

const TABS: readonly TabDef<VisitorTab>[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'repeat', label: 'Came back' },
]

export default function VisitorsPage() {
  const auth = useAuth()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<VisitorTab>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!auth.isReady) return
    if (!auth.isAuthenticated) {
      auth.loginRequiredRedirect()
      return
    }

    let cancelled = false
    setLoading(true)

    // `?filter=repeat` has existed on the route since repeat visitors were
    // added and no UI had ever asked for it.
    fetch(`/api/profile/visitors${tab === 'repeat' ? '?filter=repeat' : ''}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setVisitors(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setVisitors([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [auth.isReady, auth.isAuthenticated, tab])

  // Client-side: the list is capped at eight rows server-side, so there is
  // nothing here a round trip would find that a filter cannot.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return visitors
    return visitors.filter((v) =>
      `${v.name} ${v.city}`.toLowerCase().includes(needle),
    )
  }, [visitors, query])

  const repeatCount = visitors.filter((v) => v.isRepeat).length

  return (
    <div className="page-shell">
      <h1 className="page-title">Who viewed you</h1>

      <div className="list-controls">
        <TabStrip
          tabs={TABS.map((t) =>
            t.key === 'repeat' && tab === 'all' && repeatCount > 0
              ? { ...t, count: repeatCount }
              : t,
          )}
          active={tab}
          onChange={setTab}
          label="Visitor lists"
        />

        <label className="list-search">
          <span className="sr-only">Search visitors by name or city</span>
          <input
            type="search"
            className="list-search-input"
            placeholder="Search by name or city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <div className="panel-skeleton" aria-hidden="true" />
      ) : visible.length === 0 ? (
        <div className="match-empty">
          <p className="match-empty-title">
            {visitors.length === 0 ? 'Nobody has viewed you yet' : 'No visitors match that search'}
          </p>
          <p className="match-empty-text">
            {visitors.length === 0
              ? 'A complete profile with a photo gets seen far more often. Views are counted over the last 30 days.'
              : 'Try a shorter search, or clear it to see everyone.'}
          </p>
        </div>
      ) : (
        <ul className="visitor-grid">
          {visible.map((visitor) => {
            const presence = presenceFor(visitor.presence)
            return (
              <li key={visitor.profileId}>
                <Link href={profileHref(visitor.profileId, '/visitors')} className="visitor-card">
                  <span className="visitor-card-portrait">
                    <Avatar
                      src={visitor.photo}
                      name={visitor.name || 'Vivah4U member'}
                      className="visitor-card-avatar"
                      decorative
                    />
                    {presence.online && <span className="presence-dot presence-dot-online" />}
                  </span>

                  <span className="min-w-0">
                    <span className="visitor-name">
                      {visitor.name || 'Vivah4U member'}
                      {visitor.age ? `, ${visitor.age}` : ''}
                      <VerifiedBadge
                        level={(visitor.verificationLevel ?? 0) as 0 | 1 | 2 | 3}
                        size="sm"
                      />
                    </span>
                    <span className="visitor-meta">
                      {[visitor.city, relativeTime(visitor.lastSeen)].filter(Boolean).join(' · ')}
                    </span>
                    {visitor.isRepeat && (
                      <span className="visitor-repeat">Viewed you {visitor.visits} times</span>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
