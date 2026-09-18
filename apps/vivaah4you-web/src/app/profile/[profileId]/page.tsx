'use client'

import React, { Suspense, use, useEffect, useState } from 'react'
import Link from 'next/link'
import { HeartHandshake } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import ProfileDetails from '@/components/profile/ProfileDetails'
import ProfileHeroPanel from '@/components/profile/ProfileHeroPanel'
import ProfileBio from '@/components/profile/ProfileBio'
import ProfileMediaPicks from '@/components/profile/ProfileMediaPicks'
import FamilyGraph from '@/components/profile/FamilyGraph'
import PhotoStrip from '@/components/profile/PhotoStrip'
import CompatibilityPanel from '@/components/profile/CompatibilityPanel'
import { compareProfiles, statedPreferenceCount } from '@/lib/compatibility'
import { fullName } from '@/lib/profileDisplay'
import { tagSearchHref } from '@/lib/matchFilters'
import { managedByLine } from '@/lib/managedBy'
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
  /* Only worth teasing when there is something behind it. A member who has set
     no preferences has nothing to measure anyone against, and CompatibilityPanel
     says exactly that to a signed-in reader - so promising a match here would
     be writing a cheque the next screen cannot cash. */
  const statedPreferences = statedPreferenceCount(profile)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-color-primary-surface/40 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <BackBar {...back} />

        <ProfileHeroPanel
          profile={profile}
          subtitle={
            <>
              {profile.profile_id && <p className="profile-hero-id">{profile.profile_id}</p>}
            </>
          }
          /* Signed out this is `undefined`, not a sign-in button, and the
             panel omits the whole actions block rather than rendering an empty
             one. The page used to ask twice - here and again lower down - and
             the lower ask is the better of the two: it names what signing in
             gets you instead of only where it leads. */
          actions={
            auth.isAuthenticated ? <InterestButton profileId={profile.profile_id} /> : undefined
          }
          managed={managedByLine(profile.managedBy, profile.gender, { owner: false })}
          bio={<ProfileBio bare value={profile.aboutMe ?? ''} heading={`About ${firstName}`} />}
          /* `me` is already fetched for the comparison panel, so seeding a tag
             with the reader's own preferences costs no extra request. Signed
             out there is nothing to seed from and the tag is the whole filter. */
          searchHref={(filter) => tagSearchHref(filter, me)}
        />

        {/* One row. Photos on the left at two thumbnails wide, the tree taking
            the rest - see `.profile-panel-row`, which also covers the case of
            either one rendering null. Photos first: they are what a reader
            actually came to look at, and the tree reads better once you know
            the face. Below `lg` the row stacks and the order still holds. */}
        <div className="profile-panel-row gap-6">
          <PhotoStrip photos={profile.photos ?? []} name={fullName(profile) || 'this member'} />

          {/* Unconditional. This used to be hidden for a signed-in reader
              because the comparison panel drew the same tree beside their own;
              that block is gone, so without this every signed-in reader would
              see no family at all. */}
          <FamilyGraph
            profile={profile}
            profileId={profile.profile_id}
            selfLabel={`${firstName} and their siblings`}
            selfName={firstName}
            selfPhoto={profile.photo}
          />
        </div>

        <ProfileDetails profile={profile} columns={2} />

        {/* After the field rows, not among them: a wall of artwork above the
            basics would answer "what do they watch" before "who are they". */}
        <ProfileMediaPicks profile={profile} />

        {/* Below the profile, not above it: the comparison is what you read
            once you have formed a view of the person. Used to be exclusive to
            the dashboard's inline profile, which no longer exists.

            Signed out, this slot would otherwise be empty: the raw preference
            list is owner-only now, so a logged-out reader lost both the panel
            and the thing it replaced. The teaser keeps the slot honest - it
            says what is behind the door rather than leaving a gap. */}
        {me ? (
          <CompatibilityPanel
            compatibility={compareProfiles(me, profile)}
            theirName={firstName}
            theirPhoto={profile.photo}
            theirGender={profile.gender}
            myName={fullName(me) || 'You'}
            myPhoto={me.photo}
          />
        ) : (
          !auth.isAuthenticated && statedPreferences > 0 && (
            <section className="form-section">
              <h3 className="form-section-title">
                <HeartHandshake className="form-section-icon" strokeWidth={1.8} aria-hidden="true" />
                How you would match
              </h3>
              <p className="form-section-hint">
                {firstName} has said{' '}
                <strong>
                  {statedPreferences} {statedPreferences === 1 ? 'thing' : 'things'}
                </strong>{' '}
                about who they are looking for. Sign in and we will show you which of them
                you meet.
              </p>
              <Link
                href={`/login?next=/profile/${profile.profile_id}`}
                className="btn-primary mt-3 inline-block"
              >
                Sign in to see your match
              </Link>
            </section>
          )
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
