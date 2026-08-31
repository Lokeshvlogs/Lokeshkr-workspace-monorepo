'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import MatchesSection from '@/components/profile/MatchesSection'
import ProfileStrengthCard from '@/components/home/ProfileStrengthCard'
import InsightsPanel, { type MemberStats } from '@/components/home/InsightsPanel'
import { useAuth } from '@/components/authProvider'
import type { MyProfile } from '@/types/profile'

/** Headline figures, shown across the welcome band. */
function StatTile({
  value,
  label,
  hint,
  suffix,
}: { value: number; label: string; hint?: string; suffix?: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-value">
        {value}
        {suffix && <span className="stat-suffix">{suffix}</span>}
      </span>
      <span className="stat-label">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  )
}

/**
 * The signed-in home page.
 *
 * Deliberately not the marketing page: no collage, no tagline, no sales copy.
 * A member arriving here wants to search, to see who matched, and to know what
 * has happened since they were last here - so the layout is a dashboard with
 * search as its centre column.
 */
export default function MemberHome() {
  const auth = useAuth()
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // One pass for both panels; they render from the same two payloads.
    Promise.all([
      fetch('/api/profile/me').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/profile/stats').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([me, activity]) => {
      if (cancelled) return
      if (me) setProfile(me)
      if (activity) setStats(activity)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const firstName = profile?.firstName || auth.username.split('@')[0] || 'there'
  const completeness = profile?.profile_completeness ?? 0
  const complete = auth.isProfileComplete || completeness >= 95

  return (
    <div className="dashboard">
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <header className="welcome">
          <div className="welcome-main">
            {profile?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photo} alt="" className="welcome-avatar" />
            ) : (
              <span className="welcome-avatar welcome-avatar-initial" aria-hidden="true">
                {firstName.charAt(0).toUpperCase()}
              </span>
            )}

            <div className="min-w-0">
              <h1 className="welcome-greeting">Welcome back, {firstName}</h1>
              <p className="welcome-sub">
                {complete
                  ? 'Your profile is live and visible to matches.'
                  : 'Finish your profile to appear in other members’ matches.'}
              </p>
            </div>

            {!complete && (
              <Link href="/profile/register" className="btn-primary welcome-cta">
                Complete profile
              </Link>
            )}
          </div>

          <div className="welcome-stats">
            <StatTile value={stats?.profileViews ?? 0} label="Profile views" hint="last 30 days" />
            <StatTile value={stats?.uniqueVisitors ?? 0} label="Visitors" hint="unique people" />
            <StatTile value={stats?.matches ?? 0} label="Matches" hint="available now" />
            <StatTile value={completeness} label="Profile complete" hint="all sections" suffix="%" />
          </div>
        </header>

        <div className="dashboard-grid">
          <aside className="dashboard-side dashboard-side-left">
            <ProfileStrengthCard profile={profile} loading={loading} />
          </aside>

          <main className="dashboard-main">
            <MatchesSection />
          </main>

          <aside className="dashboard-side dashboard-side-right">
            <InsightsPanel stats={stats} loading={loading} />
          </aside>
        </div>
      </div>
    </div>
  )
}
