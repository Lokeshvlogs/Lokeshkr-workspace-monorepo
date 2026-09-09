'use client'

import React, { Suspense, useEffect, useState } from 'react'

import WelcomeHeader from '@/components/home/WelcomeHeader'
import StatCards from '@/components/home/StatCards'
import TrendingRail from '@/components/home/TrendingRail'
import MatchesSection from '@/components/profile/MatchesSection'
import { useAuth } from '@/components/authProvider'
import type { MemberStats } from '@/types/stats'
import type { MyProfile } from '@/types/profile'

/**
 * The signed-in home page.
 *
 * Matches lead. An earlier pass made this a grid of stat cards over an activity
 * feed, which read as a back-office summary screen - a page about the account
 * rather than a page about people. The figures are still here as a strip you
 * can glance past, and the activity feed has a route of its own for when
 * somebody actually wants it.
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
      <div className="container mx-auto flex flex-col gap-6 px-4 py-8 sm:px-6">
        <WelcomeHeader profile={profile} fallbackName={fallbackName} />

        <StatCards stats={stats} loading={loading} />

        <TrendingRail />

        <Suspense fallback={<div className="panel-skeleton" aria-hidden="true" />}>
          <MatchesSection />
        </Suspense>
      </div>
    </div>
  )
}
