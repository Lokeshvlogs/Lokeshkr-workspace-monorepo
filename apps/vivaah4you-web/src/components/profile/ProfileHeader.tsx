'use client'

import React, { ReactNode } from 'react'

import Avatar from '@/components/profile/Avatar'
import NameWithBadge from '@/components/profile/NameWithBadge'
import { formatHeight, fullName, labelFor, locationLabel } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

interface Props {
  profile: PublicProfile
  /** Buttons rendered on the right of the header. */
  actions?: ReactNode
}

export default function ProfileHeader({ profile, actions }: Props) {
  const name = fullName(profile) || 'Vivah4U member'
  const summary = [
    profile.age ? `${profile.age} yrs` : '',
    formatHeight(profile.heightFeet, profile.heightInches),
    labelFor('religion', profile.religion),
    labelFor('profession', profile.profession),
    locationLabel(profile),
  ].filter(Boolean)

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-color-border bg-white p-6 sm:flex-row sm:items-start">
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-color-primary-tint bg-color-primary-surface">
        <Avatar
          src={profile.photo}
          name={name}
          className="h-full w-full object-cover"
          initialClassName="flex items-center justify-center text-3xl font-semibold text-color-primary"
        />
      </div>

      <div className="flex-1 text-center sm:text-left">
        <h1>
          <NameWithBadge
            name={name}
            level={profile.verification_level}
            size="lg"
            className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900"
          />
        </h1>
        {profile.profile_id && (
          <p className="mt-0.5 font-mono text-xs text-color-placeholder-text">{profile.profile_id}</p>
        )}
        {profile.managedByLabel && (
          <p className="managed-by">{profile.managedByLabel}</p>
        )}
        <p className="mt-2 text-sm text-gray-600">{summary.join('  ·  ')}</p>
      </div>

      {actions && <div className="flex shrink-0 flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}
