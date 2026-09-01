'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export interface MemberStats {
  windowDays: number
  profileViews: number
  uniqueVisitors: number
  viewsMade: number
  matches: number
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
}

/** "3 days ago" from an ISO timestamp, without pulling in a date library. */
function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.round(days / 30)}mo ago`
}

interface InsightsPanelProps {
  stats: MemberStats | null
  loading: boolean
}

export default function InsightsPanel({ stats, loading }: InsightsPanelProps) {
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
                <Link href={`/profile/${visitor.profileId}`} className="visitor">
                  {visitor.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={visitor.photo} alt="" className="visitor-avatar" />
                  ) : (
                    <span className="visitor-avatar visitor-avatar-initial" aria-hidden="true">
                      {(visitor.name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="visitor-name">
                      {visitor.name || 'Vivah4U member'}
                      {visitor.age ? `, ${visitor.age}` : ''}
                    </span>
                    <span className="visitor-meta">
                      {[visitor.city, relativeTime(visitor.lastSeen)].filter(Boolean).join(' · ')}
                    </span>
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
            </dl>
            <p className="panel-foot">Counts cover the last {stats.windowDays} days.</p>
          </>
        )}
      </section>
    </div>
  )
}
