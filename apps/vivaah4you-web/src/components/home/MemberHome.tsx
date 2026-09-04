'use client'

import { useCallback, useEffect, useState } from 'react'

import MatchesSection from '@/components/profile/MatchesSection'
import WelcomeHeader from '@/components/home/WelcomeHeader'
import MyProfileView from '@/components/home/MyProfileView'
import MatchProfileView from '@/components/home/MatchProfileView'
import InsightsPanel, { type MemberStats } from '@/components/home/InsightsPanel'
import { useCenterView } from '@/components/home/useCenterView'
import { useAuth } from '@/components/authProvider'
import type { MyProfile } from '@/types/profile'

/**
 * The signed-in home page.
 *
 * Deliberately not the marketing page: no collage, no tagline, no sales copy.
 * A member arriving here wants to search, to see who matched, and to know what
 * has happened since they were last here.
 *
 * The centre column is a view switcher rather than a set of links away: the
 * matches grid, the member's own profile, and one match alongside a comparison
 * with them. Everything around it - the welcome band, the insights - stays put
 * while that changes.
 */
export default function MemberHome() {
  const auth = useAuth()
  const { view, showMatches, showMe, showMatch } = useCenterView()

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

  /**
   * Saves a single inline edit and reflects the new completeness.
   *
   * Lives here rather than inside the profile view so the welcome band's ring
   * and its call to action update the moment a field is filled in - which they
   * did not when this view was a page of its own.
   */
  const saveField = useCallback(
    async (step: number, patch: Record<string, unknown>): Promise<boolean> => {
      try {
        const response = await fetch('/api/profile/save-step', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step, ...patch }),
        })

        if (response.status === 401) {
          auth.loginRequiredRedirect()
          return false
        }

        const result = await response.json().catch(() => ({}))
        if (!response.ok || !result.success) return false

        // Re-read rather than trusting the local patch: the server normalises
        // values (marital status, gender, dates) on the way in.
        const fresh = await fetch('/api/profile/me')
        if (fresh.ok) {
          const data = await fresh.json()
          setProfile(data)
          auth.setProfileComplete(Boolean(data.is_complete))
        }
        return true
      } catch {
        return false
      }
    },
    [auth],
  )

  /**
   * Opens someone's profile, or your own view if the id turns out to be you -
   * comparing yourself against yourself would report a perfect match.
   */
  const openProfile = useCallback(
    (profileId: string) => {
      if (profile?.profile_id && profileId === profile.profile_id) showMe()
      else showMatch(profileId)
    },
    [profile?.profile_id, showMe, showMatch],
  )

  const fallbackName = auth.username.split('@')[0] || 'there'

  return (
    <div className="dashboard">
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <WelcomeHeader
          profile={profile}
          stats={stats}
          fallbackName={fallbackName}
          onViewProfile={showMe}
        />

        <div className="dashboard-grid">
          <main className="dashboard-main">
            {/* The matches grid stays mounted and is hidden rather than
                unmounted: its filters, sort and fetched results are local
                state, and discarding them on every profile open would refire
                the request and silently clear the member's search. */}
            <div className={view.kind === 'matches' ? undefined : 'hidden'}>
              <MatchesSection onOpenProfile={openProfile} />
            </div>

            {view.kind === 'me' &&
              (profile ? (
                <MyProfileView profile={profile} onSave={saveField} />
              ) : loading ? (
                <div className="panel-skeleton" aria-hidden="true" />
              ) : (
                // The fetch finished without a profile, so waiting longer will
                // not help; offer the way back rather than a permanent skeleton.
                <div className="center-error">
                  <p className="match-empty-title">Could not load your profile</p>
                  <p className="match-empty-text">Check your connection and try again.</p>
                  <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-4">
                    Retry
                  </button>
                </div>
              ))}

            {view.kind === 'match' && (
              <MatchProfileView profileId={view.profileId} me={profile} onBack={showMatches} />
            )}
          </main>

          <aside className="dashboard-side dashboard-side-right">
            <InsightsPanel stats={stats} loading={loading} onOpenProfile={openProfile} />
          </aside>
        </div>
      </div>
    </div>
  )
}
