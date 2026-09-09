'use client'

import Link from 'next/link'
import { VerifiedBadge } from '@lokesh-workspace/ui'

import Avatar from '@/components/profile/Avatar'
import CompletenessRing from '@/components/profile/CompletenessRing'
import { firstIncompleteStep, missingFields } from '@/lib/profileCompletion'
import type { MyProfile } from '@/types/profile'

interface WelcomeHeaderProps {
  profile: MyProfile | null
  fallbackName: string
}

/**
 * The signed-in welcome band: who you are and how far along you are.
 *
 * The three figures it used to carry are stat cards below now - they were text
 * here, and a number you cannot click is a report rather than a way in.
 *
 * Profile strength lives here rather than in a panel of its own - it is one
 * number and one action, and it disappears entirely once there is nothing left
 * to fill in.
 */
export default function WelcomeHeader({
  profile,
  fallbackName,
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
          <Link href="/profile/me" className="welcome-link">
            View my profile
          </Link>
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

    </header>
  )
}
