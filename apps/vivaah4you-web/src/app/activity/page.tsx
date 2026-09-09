'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

import ActivityFeed from '@/components/home/ActivityFeed'
import { useAuth } from '@/components/authProvider'
import type { MemberStats } from '@/types/stats'

/**
 * Everything that has happened, and the figures behind it.
 *
 * Off the home page on purpose: matches lead there, and a member who wants the
 * account summary asks for it.
 */
export default function ActivityPage() {
  const auth = useAuth()
  const [stats, setStats] = useState<MemberStats | null>(null)

  useEffect(() => {
    if (!auth.isReady) return
    if (!auth.isAuthenticated) {
      auth.loginRequiredRedirect()
      return
    }

    let cancelled = false
    fetch('/api/profile/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [auth.isReady, auth.isAuthenticated])

  return (
    <div className="page-shell">
      <h1 className="page-title">Recent activity</h1>

      <div className="dash-lower">
        <ActivityFeed />

        <aside className="dash-aside">
          <section className="panel">
            <h2 className="panel-title">Your numbers</h2>
            {!stats ? (
              <div className="panel-skeleton-rows" aria-hidden="true">
                <span />
                <span />
              </div>
            ) : (
              <>
                <dl className="activity-list">
                  <div className="activity-row">
                    <dt>Profile views</dt>
                    <dd>{stats.profileViews}</dd>
                  </div>
                  <div className="activity-row">
                    <dt>Profiles you viewed</dt>
                    <dd>{stats.viewsMade}</dd>
                  </div>
                  <div className="activity-row">
                    <dt>Came back for another look</dt>
                    <dd>{stats.repeatVisitors}</dd>
                  </div>
                  <div className="activity-row">
                    <dt>Interests you sent</dt>
                    <dd>{stats.interestsSent}</dd>
                  </div>
                  <div className="activity-row">
                    <dt>Mutual matches</dt>
                    <dd>{stats.interestsAccepted}</dd>
                  </div>
                  <div className="activity-row">
                    <dt>Photos on your profile</dt>
                    <dd>{stats.photos}</dd>
                  </div>
                </dl>
                <p className="panel-foot">Counts cover the last {stats.windowDays} days.</p>
              </>
            )}

            <div className="panel-links">
              <Link href="/matches?tab=recent">Recently joined members</Link>
              <Link href="/interests?tab=sent">Interests you sent</Link>
              <Link href="/visitors">Who viewed you</Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
