'use client'

import React, { use, useEffect, useState } from 'react'
import Link from 'next/link'

import ProfileDetails from '@/components/profile/ProfileDetails'
import ProfileHeader from '@/components/profile/ProfileHeader'
import PhotoStrip from '@/components/profile/PhotoStrip'
import { fullName } from '@/lib/profileDisplay'
import { useAuth } from '@/components/authProvider'
import type { PublicProfile } from '@/types/profile'

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const { profileId } = use(params)
  const auth = useAuth()

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(`/api/profile/public/${encodeURIComponent(profileId)}`)
        const data = await response.json().catch(() => ({}))
        if (cancelled) return

        if (!response.ok) {
          setError(response.status === 404 ? 'This profile does not exist or is hidden.' : (data.detail ?? 'Could not load this profile.'))
        } else {
          setProfile(data)
        }
      } catch {
        if (!cancelled) setError('Network error. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [profileId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-color-placeholder-text">Loading profile…</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Profile not available</h1>
        <p className="mt-2 text-color-placeholder-text">{error}</p>
        <Link href="/" className="link mt-4 inline-block">Back to home</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-color-primary-surface/40 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <ProfileHeader
          profile={profile}
          actions={
            auth.isAuthenticated ? (
              <button type="button" className="btn bg-color-primary text-white">
                Express interest
              </button>
            ) : (
              <Link href={`/login?next=/profile/${profile.profile_id}`} className="btn bg-color-primary text-white">
                Sign in to connect
              </Link>
            )
          }
        />

        <PhotoStrip photos={profile.photos ?? []} name={fullName(profile) || "this member"} />

        <ProfileDetails profile={profile} />

        <p className="text-center text-xs text-color-placeholder-text">
          Contact details are shared only after both sides express interest.
        </p>
      </div>
    </div>
  )
}
