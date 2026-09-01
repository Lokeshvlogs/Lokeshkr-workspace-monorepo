'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import ProfileCard, { type ProfileCardData } from '@/components/profile/ProfileCard'
import MatchSearchBar, {
  EMPTY_FILTERS,
  type MatchFilters,
  type SortKey,
} from '@/components/profile/MatchSearchBar'
import { useAuth } from '@/components/authProvider'
import { formatHeight, fullName, labelFor, locationLabel } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

/** A match plus the raw profile, so filtering can read fields the card omits. */
type MatchEntry = { card: ProfileCardData; profile: PublicProfile }

const totalInches = (profile: PublicProfile): number =>
  (profile.heightFeet || 0) * 12 + (profile.heightInches || 0)

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
  details: [
    profile.heightFeet ? formatHeight(profile.heightFeet, profile.heightInches) : '',
    labelFor('religion', profile.religion),
    labelFor('community', profile.community),
    labelFor('mothertongue', profile.mothertongue),
  ].filter(Boolean),
  // Display picture plus gallery - what a visitor would actually be able to see.
  photoCount: (profile.photo ? 1 : 0) + (profile.photos?.length ?? 0),
})

function matchesFilters(profile: PublicProfile, filters: MatchFilters): boolean {
  // Exact-match filters, paired with the profile field each one tests.
  const exact: [string, string][] = [
    [filters.religion, profile.religion],
    [filters.maritalStatus, profile.maritalStatus],
    [filters.country, profile.currentCountry],
    [filters.motherTongue, profile.mothertongue],
    [filters.community, profile.community],
    [filters.education, profile.educationLevel],
    [filters.profession, profile.profession],
    [filters.diet, profile.diet],
  ]
  for (const [wanted, actual] of exact) {
    if (wanted && actual !== wanted) return false
  }

  const age = profile.age ?? 0
  if (filters.ageMin && age && age < Number(filters.ageMin)) return false
  if (filters.ageMax && age && age > Number(filters.ageMax)) return false

  // A profile with no height recorded is not excluded by a height range - it is
  // unanswered, not a mismatch, and hiding it would punish incomplete profiles.
  const height = totalInches(profile)
  if (filters.heightMin && height && height < Number(filters.heightMin)) return false
  if (filters.heightMax && height && height > Number(filters.heightMax)) return false

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

function sortEntries(entries: MatchEntry[], sort: SortKey): MatchEntry[] {
  const sorted = [...entries]
  switch (sort) {
    case 'age_asc':
      return sorted.sort((a, b) => (a.profile.age ?? 999) - (b.profile.age ?? 999))
    case 'age_desc':
      return sorted.sort((a, b) => (b.profile.age ?? 0) - (a.profile.age ?? 0))
    case 'newest':
      // The API already returns most-recent-first within equal completeness;
      // reversing that ordering is the closest signal available client-side.
      return sorted.reverse()
    case 'best':
    default:
      return sorted.sort(
        (a, b) => (b.profile.profile_completeness ?? 0) - (a.profile.profile_completeness ?? 0),
      )
  }
}

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
  const [sort, setSort] = useState<SortKey>('best')

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

  const visible = useMemo(() => {
    const filtered = entries.filter((entry) => matchesFilters(entry.profile, filters))
    return sortEntries(filtered, sort)
  }, [entries, filters, sort])

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
    <section id="profiles" className="scroll-mt-20">
      <MatchSearchBar
        filters={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        resultCount={visible.length}
        totalCount={entries.length}
      />

      <div className="match-grid mt-6">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <MatchSkeleton key={i} />)
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
