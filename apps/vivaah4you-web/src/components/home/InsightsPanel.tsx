'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { VerifiedBadge } from '@lokesh-workspace/ui'

import Avatar from '@/components/profile/Avatar'
import { relativeTime } from '@/lib/presence'

export interface MemberStats {
  windowDays: number
  profileViews: number
  uniqueVisitors: number
  repeatVisitors: number
  viewsMade: number
  matches: number
  newMatches: number
  recentlyJoined: number
  interestsReceived: number
  interestsUnseen: number
  interestsAccepted: number
  completeness: number
  photos: number
}

interface Visitor {
  profileId: string
  name: string
  age: number | null
  city: string
  photo: string | null
  lastSeen: string | null
  verificationLevel?: number
  /** Visits in the stats window. 1 unless they came back. */
  visits?: number
  isRepeat?: boolean
}

interface InsightsPanelProps {
  stats: MemberStats | null
  loading: boolean
  /** Opens a visitor's profile in place, matching the match cards. */
  onOpenProfile?: (profileId: string) => void
}

export default function InsightsPanel({ stats, loading, onOpenProfile }: InsightsPanelProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [visitorsLoading, setVisitorsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/profile/visitors')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setVisitors(data)
      })
      .catch(() => {
        // The empty state below covers this.
      })
      .finally(() => {
        if (!cancelled) setVisitorsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <section className="panel">
        <h2 className="panel-title">Who viewed you</h2>

        {visitorsLoading ? (
          <div className="panel-skeleton-rows" aria-hidden="true">
            <span /><span /><span />
          </div>
        ) : visitors.length === 0 ? (
          <p className="panel-empty">
            No profile visits yet. Profiles with a photo and a full description get seen
            far more often.
          </p>
        ) : (
          <ul className="visitor-list">
            {visitors.map((visitor) => (
              <li key={visitor.profileId}>
                <Link
                  href={`/profile/${visitor.profileId}`}
                  className="visitor"
                  onClick={(event) => {
                    // Same rule as the match cards: plain click opens in place,
                    // modifier-clicks still reach the standalone page.
                    if (!onOpenProfile) return
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                    event.preventDefault()
                    onOpenProfile(visitor.profileId)
                  }}
                >
                  <Avatar
                    src={visitor.photo}
                    name={visitor.name || 'Vivah4U member'}
                    className="visitor-avatar"
                    decorative
                  />
                  <span className="min-w-0 flex-1">
                    <span className="visitor-name">
                      {visitor.name || 'Vivah4U member'}
                      {visitor.age ? `, ${visitor.age}` : ''}
                      <VerifiedBadge level={(visitor.verificationLevel ?? 0) as 0 | 1 | 2 | 3} size="sm" />
                    </span>
                    <span className="visitor-meta">
                      {[visitor.city, relativeTime(visitor.lastSeen)].filter(Boolean).join(' · ')}
                    </span>
                    {/* The most actionable line on the dashboard: somebody who
                        came back is worth more than somebody who glanced. */}
                    {visitor.isRepeat && (
                      <span className="visitor-repeat">Viewed you {visitor.visits} times</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">Your activity</h2>
        {loading || !stats ? (
          <div className="panel-skeleton-rows" aria-hidden="true">
            <span /><span />
          </div>
        ) : (
          <>
            <dl className="activity-list">
              <div className="activity-row">
                <dt>Profiles you viewed</dt>
                <dd>{stats.viewsMade}</dd>
              </div>
              <div className="activity-row">
                <dt>Photos on your profile</dt>
                <dd>{stats.photos}</dd>
              </div>
              <div className="activity-row">
                <dt>Members you can match with</dt>
                <dd>{stats.matches}</dd>
              </div>
              <div className="activity-row">
                <dt>Came back for another look</dt>
                <dd>{stats.repeatVisitors}</dd>
              </div>
              <div className="activity-row">
                <dt>Interests awaiting your reply</dt>
                <dd>{stats.interestsReceived}</dd>
              </div>
            </dl>
            <p className="panel-foot">Counts cover the last {stats.windowDays} days.</p>
          </>
        )}
      </section>
    </div>
  )
}
