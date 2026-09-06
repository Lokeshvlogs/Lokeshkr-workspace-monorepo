'use client'

import React from 'react'
import Link from 'next/link'

import ProfileDetails from '@/components/profile/ProfileDetails'
import PhotoStrip from '@/components/profile/PhotoStrip'
import Avatar from '@/components/profile/Avatar'
import NameWithBadge from '@/components/profile/NameWithBadge'
import { formatHeight, fullName, labelFor, locationLabel } from '@/lib/profileDisplay'
import { iconFor } from '@/lib/profileIcons'
import type { MyProfile } from '@/types/profile'

/** One fact about the member, shown as icon + value. */
function HeroChip({ fieldKey, label, value }: { fieldKey: string; label: string; value: string }) {
  if (!value) return null
  const Icon = iconFor(fieldKey)

  return (
    <li className="profile-chip" title={label}>
      {Icon && <Icon className="profile-chip-icon" strokeWidth={1.6} aria-hidden="true" />}
      <span className="sr-only">{label}: </span>
      {value}
    </li>
  )
}

interface Props {
  profile: MyProfile
  /** Persists one inline edit. Resolves false when the save failed. */
  onSave: (step: number, patch: Record<string, unknown>) => Promise<boolean>
}

/**
 * The member's own profile, shown in the dashboard's centre column.
 *
 * There is no completeness card here: the welcome band above already carries
 * that number and its call to action, and having both said the same thing
 * twice on one screen.
 */
export default function MyProfileView({ profile, onSave }: Props) {
  const name = fullName(profile) || 'Your profile'

  return (
    <div className="flex flex-col gap-5">
      <section className="profile-hero">
        <Avatar src={profile.photo} name={name} className="profile-hero-avatar" decorative />

        <div className="min-w-0 flex-1">
          <h2>
            <NameWithBadge
              name={name}
              level={profile.verification_level}
              size="lg"
              className="profile-hero-name"
            />
          </h2>
          {profile.profile_id && <p className="profile-hero-id">{profile.profile_id}</p>}
          {profile.managedByLabel && (
            <p className="managed-by">{profile.managedByLabel}</p>
          )}

          <ul className="profile-chips">
            <HeroChip fieldKey="age" label="Age" value={profile.age ? `${profile.age} yrs` : ''} />
            <HeroChip
              fieldKey="height"
              label="Height"
              value={formatHeight(profile.heightFeet, profile.heightInches)}
            />
            <HeroChip fieldKey="religion" label="Religion" value={labelFor('religion', profile.religion)} />
            <HeroChip
              fieldKey="profession"
              label="Profession"
              value={labelFor('profession', profile.profession)}
            />
            <HeroChip fieldKey="currentCity" label="Lives in" value={locationLabel(profile)} />
          </ul>
        </div>

        <div className="profile-hero-actions">
          <Link href="/profile/register" className="btn bg-color-primary text-white">
            Edit in wizard
          </Link>
          {profile.profile_id && (
            // A real navigation, not an inline view: opening yourself inline
            // would be a self-view, and the point is to see the public page.
            <Link
              href={`/profile/${profile.profile_id}`}
              className="btn border border-color-border text-color-primary"
            >
              View as public
            </Link>
          )}
        </div>
      </section>

      {profile.aboutMe && (
        <section className="form-section">
          <h3 className="form-section-title">About me</h3>
          <p className="profile-about">{profile.aboutMe}</p>
        </section>
      )}

      <PhotoStrip photos={profile.photos ?? []} name={name} />

      <p className="text-sm text-color-placeholder-text">
        Tap the pencil beside any field to edit it here — no need to run through the wizard again.
      </p>

      <ProfileDetails profile={profile} editable onSave={onSave} columns={1} />

      {/* Private, and never rendered on the public page. Collapsed so it does
          not lead the view. */}
      <details className="form-section">
        <summary className="profile-private-summary">Account &amp; contact</summary>
        <p className="form-section-hint mt-1">Only visible to you.</p>
        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { label: 'Email', value: profile.email },
            { label: 'Phone', value: [profile.countryCode, profile.phone].filter(Boolean).join(' ') },
            { label: 'Profile created for', value: profile.profileFor },
            { label: 'Looking for', value: profile.lookingFor },
          ]
            .filter((row) => row.value)
            .map((row) => (
              <div key={row.label} className="flex justify-between gap-4 text-sm">
                <dt className="text-color-placeholder-text">{row.label}</dt>
                <dd className="font-medium capitalize text-gray-900">{row.value}</dd>
              </div>
            ))}
        </dl>
      </details>
    </div>
  )
}
