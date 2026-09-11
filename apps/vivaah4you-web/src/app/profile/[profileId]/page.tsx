'use client'

import React, { Suspense, use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import ProfileDetails from '@/components/profile/ProfileDetails'
import ProfileHeroPanel from '@/components/profile/ProfileHeroPanel'
import ProfileBio from '@/components/profile/ProfileBio'
import FamilyGraph from '@/components/profile/FamilyGraph'
import PhotoStrip from '@/components/profile/PhotoStrip'
import CompatibilityPanel from '@/components/profile/CompatibilityPanel'
import { compareProfiles } from '@/lib/compatibility'
import { fullName } from '@/lib/profileDisplay'
import { backTarget, DEFAULT_BACK } from '@/lib/navigation'
import { useAuth } from '@/components/authProvider'
import type { MyProfile, PublicProfile } from '@/types/profile'
import InterestButton from '@/components/profile/InterestButton'
import { detailMessage } from '@/lib/errors'

/** The bar at the top of every state of this page, including the error one. */
function BackBar({ href, label }: { href: string; label: string }) {
  return (
    <div className="center-bar">
      <Link href={href} className="center-back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {label}
      </Link>
    </div>
  )
}

function PublicProfilePageInner({ profileId }: { profileId: string }) {
  const auth = useAuth()
  const params = useSearchParams()
  const back = backTarget(params.get('from'))

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  // Only fetched when signed in, and only to drive the comparison panel.
  const [me, setMe] = useState<MyProfile | null>(null)
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
          setError(
            response.status === 404
              ? 'This profile does not exist or is hidden.'
              : detailMessage(data, 'Could not load this profile.'),
          )
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

  // Separate from the profile fetch so a slow or failed read of your own
  // profile only costs the comparison panel, not the page.
  useEffect(() => {
    if (!auth.isAuthenticated) {
      setMe(null)
      return
    }

    let cancelled = false
    fetch('/api/profile/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setMe(data)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [auth.isAuthenticated])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <BackBar {...back} />
        <div className="panel-skeleton mt-5" aria-hidden="true" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <BackBar {...back} />
        <div className="center-error mt-5">
          <p className="match-empty-title">Profile not available</p>
          <p className="match-empty-text">{error}</p>
          <Link href={DEFAULT_BACK.href} className="btn-primary mt-4 inline-block">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const firstName = profile.firstName || 'this member'

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-color-primary-surface/40 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <BackBar {...back} />

        <ProfileHeroPanel
          profile={profile}
          subtitle={
            <>
              {profile.profile_id && <p className="profile-hero-id">{profile.profile_id}</p>}
              {profile.managedByLabel && <p className="managed-by">{profile.managedByLabel}</p>}
            </>
          }
          actions={
            auth.isAuthenticated ? (
              <InterestButton profileId={profile.profile_id} />
            ) : (
              <Link href={`/login?next=/profile/${profile.profile_id}`} className="btn bg-color-primary text-white">
                Sign in to connect
              </Link>
            )
          }
        />

        <ProfileBio value={profile.aboutMe ?? ''} heading={`About ${firstName}`} />

        {/* Only when there is no comparison below: signed in, that panel shows
            this family beside the reader's own, and rendering it here as well
            put the same tree on the page twice. */}
        {!me && (
          <FamilyGraph
            profile={profile}
            profileId={profile.profile_id}
            selfLabel={`${firstName} and their siblings`}
            selfName={firstName}
            selfPhoto={profile.photo}
          />
        )}

        <PhotoStrip photos={profile.photos ?? []} name={fullName(profile) || 'this member'} />

        <ProfileDetails profile={profile} columns={2} />

        {/* Below the profile, not above it: the comparison is what you read
            once you have formed a view of the person. Used to be exclusive to
            the dashboard's inline profile, which no longer exists. */}
        {me && (
          <CompatibilityPanel
            compatibility={compareProfiles(me, profile)}
            theirName={firstName}
            theirPhoto={profile.photo}
            theirGender={profile.gender}
            myName={fullName(me) || 'You'}
            myPhoto={me.photo}
            theirProfileId={profile.profile_id}
            myProfile={me}
            theirProfile={profile}
          />
        )}

        <p className="text-center text-xs text-color-placeholder-text">
          Contact details are shared only after both sides express interest.
        </p>
      </div>
    </div>
  )
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const { profileId } = use(params)

  // `useSearchParams` opts the tree into client-side rendering, which Next
  // requires a Suspense boundary for during prerender.
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl px-4 py-10">
          <div className="panel-skeleton" aria-hidden="true" />
        </div>
      }
    >
      <PublicProfilePageInner profileId={profileId} />
    </Suspense>
  )
}
