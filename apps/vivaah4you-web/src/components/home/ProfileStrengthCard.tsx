'use client'

import Link from 'next/link'

import type { MyProfile } from '@/types/profile'

/**
 * Which wizard sections still have gaps.
 *
 * Derived from the profile the API already returned rather than a second
 * request, and it mirrors the fields the wizard itself treats as required, so
 * the list here always agrees with what the wizard will ask for.
 */
const SECTIONS: { label: string; fields: (keyof MyProfile)[] }[] = [
  { label: 'Basic details', fields: ['firstName', 'surname', 'heightFeet', 'maritalStatus'] },
  { label: 'Religion & community', fields: ['religion', 'community', 'currentCountry'] },
  { label: 'Education & career', fields: ['educationLevel', 'profession', 'salaryAmount'] },
  { label: 'Family background', fields: ['familyLivingInCountry', 'familyIncome'] },
  { label: 'Lifestyle', fields: ['diet', 'smoking', 'drinking'] },
  { label: 'Photos', fields: ['photo'] },
]

const isFilled = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return value > 0
  return String(value).trim() !== ''
}

function CompletenessRing({ value }: { value: number }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className="strength-ring" role="img" aria-label={`Profile ${clamped}% complete`}>
      <svg viewBox="0 0 72 72" className="strength-ring-svg" aria-hidden="true">
        <circle className="strength-ring-track" cx="36" cy="36" r={radius} />
        <circle
          className="strength-ring-value"
          cx="36"
          cy="36"
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

interface ProfileStrengthCardProps {
  profile: MyProfile | null
  loading: boolean
}

export default function ProfileStrengthCard({ profile, loading }: ProfileStrengthCardProps) {
  if (loading) {
    return <div className="panel panel-skeleton" aria-hidden="true" />
  }
  if (!profile) return null

  const sections = SECTIONS.map((section) => ({
    label: section.label,
    done: section.fields.every((field) => isFilled(profile[field])),
  }))
  const remaining = sections.filter((s) => !s.done)
  const completeness = profile.profile_completeness ?? 0

  return (
    <section className="panel">
      <h2 className="panel-title">Profile strength</h2>

      <div className="strength-head">
        <CompletenessRing value={completeness} />
        <p className="strength-caption">
          {remaining.length === 0
            ? 'Every section is filled in. Nicely done.'
            : `${remaining.length} ${remaining.length === 1 ? 'section' : 'sections'} left to fill in.`}
        </p>
      </div>

      <ul className="strength-list">
        {sections.map((section) => (
          <li key={section.label} className={`strength-item ${section.done ? 'strength-item-done' : ''}`}>
            <span className="strength-tick" aria-hidden="true">
              {section.done ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : null}
            </span>
            {section.label}
          </li>
        ))}
      </ul>

      {remaining.length > 0 && (
        <Link href="/profile/register" className="btn-primary mt-4 w-full">
          Continue setup
        </Link>
      )}

      <nav className="panel-links">
        <Link href="/profile/me">My profile</Link>
        {profile.profile_id && <Link href={`/profile/${profile.profile_id}`}>View as others see it</Link>}
        <Link href="/settings">Account settings</Link>
      </nav>
    </section>
  )
}
