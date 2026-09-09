'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

import WelcomeHeader from '@/components/home/WelcomeHeader'
import ActivityFeed from '@/components/home/ActivityFeed'
import StatCards from '@/components/home/StatCards'
import { useAuth } from '@/components/authProvider'
import type { MemberStats } from '@/types/stats'
import type { MyProfile } from '@/types/profile'

/**
 * The signed-in home page.
 *
 * Was a view switcher: one shell that swapped the centre column between the
 * matches grid, your own profile, interests, chats and one match, all driven by
 * `?view=`. Every one of those is a route of its own now, so what is left is
 * the thing the switcher never was - a dashboard.
 */
export default function MemberHome() {
  const auth = useAuth()
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetch('/api/profile/me').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/profile/stats').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([me, activity]) => {
      if (cancelled) return
      setProfile(me)
      setStats(activity)
      setLoading(false)
      if (me) auth.setProfileComplete(Boolean(me.is_complete))
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fallbackName = auth.username.split('@')[0] || 'there'

  return (
    <div className="dashboard">
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <WelcomeHeader profile={profile} fallbackName={fallbackName} />

        <StatCards stats={stats} loading={loading} />

        <div className="dash-lower">
          <ActivityFeed />

          <aside className="dash-aside">
            <section className="panel">
              <h2 className="panel-title">Your activity</h2>
              {loading || !stats ? (
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
                      <dt>Photos on your profile</dt>
                      <dd>{stats.photos}</dd>
                    </div>
                    <div className="activity-row">
                      <dt>Came back for another look</dt>
                      <dd>{stats.repeatVisitors}</dd>
                    </div>
                  </dl>
                  <p className="panel-foot">Counts cover the last {stats.windowDays} days.</p>
                </>
              )}

              <div className="panel-links">
                <Link href="/matches?tab=recent">Recently joined members</Link>
                <Link href="/interests?tab=sent">Interests you sent</Link>
                <Link href="/profile/me">Edit your profile</Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
