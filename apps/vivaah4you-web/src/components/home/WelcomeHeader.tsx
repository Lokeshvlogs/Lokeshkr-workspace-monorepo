'use client'

import Link from 'next/link'
import { VerifiedBadge } from '@lokesh-workspace/ui'

import Avatar from '@/components/profile/Avatar'
import { firstIncompleteStep, missingFields } from '@/lib/profileCompletion'
import type { MemberStats } from '@/components/home/InsightsPanel'
import type { MyProfile } from '@/types/profile'

/** Headline figures, shown across the welcome band. */
function StatTile({
  value,
  label,
  hint,
}: { value: number; label: string; hint?: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  )
}

/** The completeness ring, previously the head of the profile strength panel. */
function CompletenessRing({ value }: { value: number }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className="strength-ring strength-ring-sm" role="img" aria-label={`Profile ${clamped}% complete`}>
      <svg viewBox="0 0 64 64" className="strength-ring-svg" aria-hidden="true">
        <circle className="strength-ring-track" cx="32" cy="32" r={radius} />
        <circle
          className="strength-ring-value"
          cx="32"
          cy="32"
          r={radius}
          strokeDasharray={circumference}
          /* Offset is the unfilled remainder, so 100% closes the ring. */
          strokeDashoffset={circumference * (1 - clamped / 100)}
        />
      </svg>
      <span className="strength-ring-label">{clamped}%</span>
    </div>
  )
}

interface WelcomeHeaderProps {
  profile: MyProfile | null
  stats: MemberStats | null
  fallbackName: string
  /** Shows the member's own profile in the centre column. */
  onViewProfile: () => void
}

/**
 * The signed-in welcome band: who you are, how far along you are, and the three
 * figures worth knowing at a glance.
 *
 * Profile strength lives here rather than in a panel of its own - it is one
 * number and one action, and it disappears entirely once there is nothing left
 * to fill in.
 */
export default function WelcomeHeader({
  profile,
  stats,
  fallbackName,
  onViewProfile,
}: WelcomeHeaderProps) {
  const firstName = profile?.firstName || fallbackName
  const completeness = profile?.profile_completeness ?? 0

  // `is_complete` (>= 95 on the server) is what actually governs appearing in
  // match results, so it - not the 100% rule below - drives the greeting.
  const live = Boolean(profile?.is_complete)

  // The prompt is shown until the profile is genuinely finished, which is a
  // stricter bar than being visible to matches.
  const showStrength = Boolean(profile) && completeness < 100
  const remaining = showStrength ? missingFields(profile).length : 0
  const targetStep = firstIncompleteStep(profile) ?? 0

  return (
    <header className="welcome">
      <div className="welcome-main">
        <Avatar src={profile?.photo} name={firstName} className="welcome-avatar" decorative />

        <div className="min-w-0">
          <h1 className="welcome-greeting">
            Welcome back, {firstName}
            <VerifiedBadge level={(profile?.verification_level ?? 0) as 0 | 1 | 2 | 3} size="md" />
          </h1>
          <p className="welcome-sub">
            {live
              ? 'Your profile is live and visible to matches.'
              : 'Finish your profile to appear in other members’ matches.'}
          </p>
          {/* The quick links that used to sit at the foot of the profile
              strength panel; this is the only remaining way in to your own
              profile from the dashboard. */}
          <button type="button" onClick={onViewProfile} className="welcome-link">
            View my profile
          </button>
        </div>

        {showStrength && (
          <div className="welcome-strength">
            <CompletenessRing value={completeness} />

            <div className="welcome-strength-text">
              <p className="welcome-strength-title">Profile strength</p>
              <p className="welcome-strength-hint">
                {remaining} {remaining === 1 ? 'field' : 'fields'} left to fill in
              </p>
            </div>

            {/* Lands on the first step that actually has a gap, rather than
                restarting the wizard from the beginning. */}
            <Link href={`/profile/register?step=${targetStep}`} className="btn-primary shrink-0">
              Complete profile
            </Link>
          </div>
        )}
      </div>

      <div className="welcome-stats">
        <StatTile value={stats?.profileViews ?? 0} label="Profile views" hint="last 30 days" />
        <StatTile value={stats?.uniqueVisitors ?? 0} label="Visitors" hint="unique people" />
        <StatTile value={stats?.matches ?? 0} label="Matches" hint="available now" />
      </div>
    </header>
  )
}
