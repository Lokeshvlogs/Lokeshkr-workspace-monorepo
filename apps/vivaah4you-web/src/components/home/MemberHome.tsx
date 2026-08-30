'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import MatchesSection from '@/components/profile/MatchesSection'
import { useAuth } from '@/components/authProvider'
import type { MyProfile } from '@/types/profile'

/** Donut showing how far through the wizard the member is. */
function CompletenessRing({ value }: { value: number }) {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className="completeness" role="img" aria-label={`Profile ${clamped}% complete`}>
      <svg viewBox="0 0 56 56" className="completeness-svg" aria-hidden="true">
        <circle className="completeness-track" cx="28" cy="28" r={radius} />
        <circle
          className="completeness-value"
          cx="28"
          cy="28"
          r={radius}
          strokeDasharray={circumference}
          /* Dash offset is the unfilled remainder, so 100% closes the ring. */
          strokeDashoffset={circumference * (1 - clamped / 100)}
        />
      </svg>
      <span className="completeness-label">{clamped}%</span>
    </div>
  )
}

/**
 * The signed-in home page.
 *
 * Deliberately not the marketing page: no collage, no tagline, no sales copy.
 * A member arriving here wants to search and to see who matched, so the strip
 * below is kept to one line and search takes over from there.
 */
export default function MemberHome() {
  const auth = useAuth()
  const [profile, setProfile] = useState<MyProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/profile/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setProfile(data)
      })
      .catch(() => {
        // The strip degrades to the username from auth state.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const firstName = profile?.firstName || auth.username.split('@')[0] || 'there'
  const completeness = profile?.profile_completeness ?? 0
  const complete = auth.isProfileComplete || completeness >= 95

  return (
    <div className="member-home">
      <div className="container mx-auto px-6 py-8">
        <header className="member-strip">
          <div className="member-identity">
            {profile?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photo} alt="" className="member-avatar" />
            ) : (
              <span className="member-avatar member-avatar-initial" aria-hidden="true">
                {firstName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="member-greeting">Welcome back, {firstName}</h1>
              <p className="member-subline">
                {complete
                  ? 'Your profile is live and visible to matches.'
                  : 'Finish your profile to appear in other members’ matches.'}
              </p>
            </div>
          </div>

          <div className="member-actions">
            {!complete && <CompletenessRing value={completeness} />}
            {complete ? (
              <Link href="/profile/me" className="btn border border-color-border bg-white">
                My profile
              </Link>
            ) : (
              <Link href="/profile/register" className="btn-primary">
                Complete profile
              </Link>
            )}
          </div>
        </header>

        <MatchesSection />
      </div>
    </div>
  )
}
