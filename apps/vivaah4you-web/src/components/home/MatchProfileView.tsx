'use client'

import React, { useEffect, useState } from 'react'

import ProfileDetails from '@/components/profile/ProfileDetails'
import PhotoStrip from '@/components/profile/PhotoStrip'
import CompatibilityPanel from '@/components/profile/CompatibilityPanel'
import Avatar from '@/components/profile/Avatar'
import NameWithBadge from '@/components/profile/NameWithBadge'
import { compareProfiles } from '@/lib/compatibility'
import { fullName, labelFor, locationLabel } from '@/lib/profileDisplay'
import type { MyProfile, PublicProfile } from '@/types/profile'

interface Props {
  profileId: string
  /** The signed-in member, for the comparison. Null while it is still loading. */
  me: MyProfile | null
  onBack: () => void
}

/**
 * One match, opened in the dashboard's centre column.
 *
 * Fetches the same endpoint the standalone public page uses, which is what
 * records the visit for the owner's "who viewed you" list - the POST lives in
 * that Next route handler, not here. For the same reason the response is
 * deliberately not cached between opens: a repeat visit is a real visit.
 */
export default function MatchProfileView({ profileId, me, onBack }: Props) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setProfile(null)

    fetch(`/api/profile/public/${encodeURIComponent(profileId)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (cancelled) return

        if (!response.ok) {
          setError(
            response.status === 404
              ? 'This profile does not exist or is hidden.'
              : (data.detail ?? 'Could not load this profile.'),
          )
        } else {
          setProfile(data)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Network error. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // Keyed on profileId, so clicking a second match while the first is still
    // in flight cannot paint the wrong person.
    return () => {
      cancelled = true
    }
  }, [profileId])

  const backBar = (
    <div className="center-bar">
      <button type="button" onClick={onBack} className="center-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to matches
      </button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        {backBar}
        <div className="panel-skeleton" aria-hidden="true" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col gap-5">
        {backBar}
        <div className="center-error">
          <p className="match-empty-title">Profile not available</p>
          <p className="match-empty-text">{error || 'Profile unavailable.'}</p>
          <button type="button" onClick={onBack} className="btn-primary mt-4">
            Back to matches
          </button>
        </div>
      </div>
    )
  }

  const name = fullName(profile) || 'Vivah4U member'
  const firstName = profile.firstName || 'They'

  return (
    <div className="flex flex-col gap-5">
      {backBar}

      <section className="profile-hero">
        <Avatar src={profile.photo} name={name} className="profile-hero-avatar" />

        <div className="min-w-0 flex-1">
          <h2>
            <NameWithBadge
              name={name}
              level={profile.verification_level}
              size="lg"
              className="profile-hero-name"
            >
              {profile.age ? <span className="profile-hero-age">{profile.age}</span> : null}
            </NameWithBadge>
          </h2>
          {profile.managedByLabel && (
            <p className="managed-by">{profile.managedByLabel}</p>
          )}
          <p className="profile-hero-sub">
            {[
              labelFor('profession', profile.profession),
              labelFor('educationLevel', profile.educationLevel),
              locationLabel(profile),
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </p>
        </div>

        <div className="profile-hero-actions">
          <button type="button" className="btn bg-color-primary text-white">
            Express interest
          </button>
        </div>
      </section>

      {/* Without my own profile there is nothing to compare against, so the
          panel is omitted rather than rendered empty. */}
      {me && <CompatibilityPanel compatibility={compareProfiles(me, profile)} theirName={firstName} />}

      {profile.aboutMe && (
        <section className="form-section">
          <h3 className="form-section-title">About {firstName}</h3>
          <p className="profile-about">{profile.aboutMe}</p>
        </section>
      )}

      <PhotoStrip photos={profile.photos ?? []} name={name} />

      <ProfileDetails profile={profile} columns={1} />

      <p className="text-center text-xs text-color-placeholder-text">
        Contact details are shared only after both sides express interest.
      </p>
    </div>
  )
}
