'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import ProfileCard, { type ProfileCardData } from '@/components/profile/ProfileCard'
import MatchSearchBar, { EMPTY_FILTERS, type MatchFilters } from '@/components/profile/MatchSearchBar'
import { useAuth } from '@/components/authProvider'
import { formatHeight, fullName, labelFor, locationLabel } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

/** A match plus the raw profile, so filtering can read fields the card omits. */
type MatchEntry = { card: ProfileCardData; profile: PublicProfile }

const toCard = (profile: PublicProfile): ProfileCardData => ({
  profileId: profile.profile_id,
  name: fullName(profile) || 'Vivah4U member',
  age: profile.age,
  location: locationLabel(profile),
  image: profile.photo,
  headline: [
    labelFor('profession', profile.profession),
    labelFor('educationLevel', profile.educationLevel),
  ]
    .filter(Boolean)
    .join(' · '),
  // Community was the whole headline before, which put caste on every card
  // above everything else. It reads better as one detail among several.
  details: [
    profile.heightFeet ? formatHeight(profile.heightFeet, profile.heightInches) : '',
    labelFor('religion', profile.religion),
    labelFor('community', profile.community),
    labelFor('mothertongue', profile.mothertongue),
  ].filter(Boolean),
})

function matchesFilters(profile: PublicProfile, filters: MatchFilters): boolean {
  if (filters.religion && profile.religion !== filters.religion) return false
  if (filters.maritalStatus && profile.maritalStatus !== filters.maritalStatus) return false
  if (filters.country && profile.currentCountry !== filters.country) return false

  const age = profile.age ?? 0
  if (filters.ageMin && age && age < Number(filters.ageMin)) return false
  if (filters.ageMax && age && age > Number(filters.ageMax)) return false

  const query = filters.query.trim().toLowerCase()
  if (query) {
    const haystack = [
      fullName(profile),
      locationLabel(profile),
      labelFor('profession', profile.profession),
      labelFor('community', profile.community),
      labelFor('educationLevel', profile.educationLevel),
    ]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(query)) return false
  }

  return true
}

/** Keeps the grid from collapsing while the first request is in flight. */
function MatchSkeleton() {
  return (
    <div className="match-skeleton" aria-hidden="true">
      <div className="match-skeleton-media" />
      <div className="match-skeleton-line" />
      <div className="match-skeleton-line match-skeleton-line-short" />
    </div>
  )
}

export default function MatchesSection() {
  const auth = useAuth()
  const [entries, setEntries] = useState<MatchEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS)

  useEffect(() => {
    // Matches are members-only, so there is nothing to fetch when signed out.
    if (!auth.isAuthenticated) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch('/api/profile/matches')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data)) return
        setEntries(
          (data as PublicProfile[]).map((profile) => ({ card: toCard(profile), profile })),
        )
      })
      .catch(() => {
        // Leave the list empty; the empty state below explains it.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [auth.isAuthenticated])

  const visible = useMemo(
    () => entries.filter((entry) => matchesFilters(entry.profile, filters)),
    [entries, filters],
  )

  // Signed out: no search bar and no profiles at all, just the reason why.
  if (!auth.isAuthenticated) {
    return (
      <section id="profiles" className="mt-20">
        <div className="match-gate">
          <h2 className="match-gate-title">Matches are for members</h2>
          <p className="match-gate-text">
            Create your free profile to search verified members and see who matches your
            preferences. Profiles are never shown publicly.
          </p>
          <div className="match-gate-actions">
            <Link href="/#register" className="btn-primary">Create your profile</Link>
            <Link href="/login" className="btn border border-color-border">Sign in</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="profiles" className="mt-20">
      <MatchSearchBar
        filters={filters}
        onChange={setFilters}
        resultCount={visible.length}
        totalCount={entries.length}
      />

      {!auth.isProfileComplete && (
        <div className="auth-alert mt-5 flex flex-wrap items-center justify-between gap-3">
          <span>Finish your profile to appear in other members&rsquo; matches.</span>
          <Link href="/profile/register" className="link shrink-0">Complete profile →</Link>
        </div>
      )}

      <div className="match-grid mt-6">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <MatchSkeleton key={i} />)
          : visible.map((entry) => <ProfileCard key={entry.card.profileId} {...entry.card} />)}
      </div>

      {!loading && entries.length === 0 && (
        <div className="match-empty">
          <p className="match-empty-title">No matches yet</p>
          <p className="match-empty-text">
            We will show members here as soon as there are profiles that fit what you are
            looking for. Completing your own profile helps us find them faster.
          </p>
        </div>
      )}

      {!loading && entries.length > 0 && visible.length === 0 && (
        <div className="match-empty">
          <p className="match-empty-title">No profiles match these filters</p>
          <p className="match-empty-text">Try widening the age range or clearing a filter.</p>
          <button
            type="button"
            className="chip chip-square mt-4"
            onClick={() => setFilters(EMPTY_FILTERS)}
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  )
}
