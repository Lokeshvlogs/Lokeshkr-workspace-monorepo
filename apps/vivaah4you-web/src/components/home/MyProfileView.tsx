'use client'

import React, { useState } from 'react'
import Link from 'next/link'

import ProfileDetails from '@/components/profile/ProfileDetails'
import ProfileHeroPanel from '@/components/profile/ProfileHeroPanel'
import ProfileBio from '@/components/profile/ProfileBio'
import FamilyGraph from '@/components/profile/FamilyGraph'
import FamilyEditor from '@/components/profile/FamilyEditor'
import PhotoStrip from '@/components/profile/PhotoStrip'
import { fullName } from '@/lib/profileDisplay'
import type { MyProfile } from '@/types/profile'

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
  const [editingFamily, setEditingFamily] = useState(false)
  const name = fullName(profile) || 'Your profile'

  return (
    <div className="flex flex-col gap-5">
      <ProfileHeroPanel
        profile={profile}
        onSave={onSave}
        subtitle={
          <>
            {profile.profile_id && <p className="profile-hero-id">{profile.profile_id}</p>}
            {profile.managedByLabel && <p className="managed-by">{profile.managedByLabel}</p>}
          </>
        }
        actions={
          <>
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
          </>
        }
      />

      <ProfileBio value={profile.aboutMe ?? ''} heading="About me" onSave={onSave} />

      {editingFamily ? (
        <FamilyEditor onClose={() => setEditingFamily(false)} />
      ) : (
        <FamilyGraph
          profile={profile}
          selfLabel="You and your siblings"
          selfName={profile.firstName || 'You'}
          selfPhoto={profile.photo}
          onEdit={() => setEditingFamily(true)}
        />
      )}

      <PhotoStrip photos={profile.photos ?? []} name={name} />

      <p className="text-sm text-color-placeholder-text">
        Tap the pencil beside any field to edit it here — no need to run through the wizard again.
      </p>

      <ProfileDetails profile={profile} editable onSave={onSave} columns={2} />

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
