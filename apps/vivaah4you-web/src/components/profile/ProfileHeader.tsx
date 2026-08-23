'use client'

import React, { ReactNode } from 'react'

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
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-pink-100 bg-pink-50">
        {profile.photo ? (
          // Remote/base64 avatars of unknown dimensions - plain img keeps this simple.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photo} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-color-primary">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        {profile.profile_id && (
          <p className="mt-0.5 font-mono text-xs text-color-placeholder-text">{profile.profile_id}</p>
        )}
        <p className="mt-2 text-sm text-gray-600">{summary.join('  ·  ')}</p>
      </div>

      {actions && <div className="flex shrink-0 flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}
