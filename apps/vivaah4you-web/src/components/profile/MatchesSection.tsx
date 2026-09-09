'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import ProfileCard, { type ProfileCardData } from '@/components/profile/ProfileCard'
import MatchSearchBar, {
  EMPTY_FILTERS,
  type MatchFilters,
  type SortKey,
} from '@/components/profile/MatchSearchBar'
import TabStrip, { type TabDef } from '@/components/common/TabStrip'
import { currentPath } from '@/lib/navigation'
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
  verificationLevel: profile.verification_level ?? 0,
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
      // Mirrors the server's ordering in /profiles/matches. Sorting on
      // completeness alone here silently undid the verification ranking the
      // server had just applied.
      return sorted.sort(
        (a, b) =>
          (b.profile.verification_level ?? 0) - (a.profile.verification_level ?? 0) ||
          (b.profile.profile_completeness ?? 0) - (a.profile.profile_completeness ?? 0),
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

type MatchTab = 'all' | 'new' | 'recent'

const MATCH_TABS: readonly TabDef<MatchTab>[] = [
  { key: 'all', label: 'All matches' },
  { key: 'new', label: 'New' },
  { key: 'recent', label: 'Recently joined' },
]

/**
 * Filters and sort live in the query string.
 *
 * They used to be component state, which survived opening a profile only
 * because the grid was never unmounted - it sat behind a `hidden` class in the
 * dashboard. On its own route it unmounts, and state would be lost on every
 * Back. The URL restores it for free, and makes a filtered search shareable.
 */
function filtersFromParams(params: URLSearchParams): MatchFilters {
  const next = { ...EMPTY_FILTERS }
  for (const key of Object.keys(EMPTY_FILTERS) as (keyof MatchFilters)[]) {
    const value = params.get(key)
    if (value) next[key] = value
  }
  return next
}

function paramsFromState(filters: MatchFilters, sort: SortKey, tab: MatchTab): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  if (sort !== 'best') params.set('sort', sort)
  if (tab !== 'all') params.set('tab', tab)
  return params.toString()
}

export default function MatchesSection() {
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [entries, setEntries] = useState<MatchEntry[]>([])
  const [loading, setLoading] = useState(true)
  /* Held separately from `entries` so the badge does not drop to zero the
     moment the member opens the New tab and the list is replaced. */
  const [newCount, setNewCount] = useState(0)

  const filters = useMemo(() => filtersFromParams(params), [params])
  const sort = (params.get('sort') as SortKey) || 'best'
  const rawTab = params.get('tab')
  const tab: MatchTab = rawTab === 'new' || rawTab === 'recent' ? rawTab : 'all'

  /* `replace`, not `push`: typing in the search box must not fill the history
     stack with a step per keystroke. */
  const write = useCallback(
    (nextFilters: MatchFilters, nextSort: SortKey, nextTab: MatchTab) => {
      const query = paramsFromState(nextFilters, nextSort, nextTab)
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  const setFilters = useCallback(
    (next: MatchFilters) => write(next, sort, tab),
    [write, sort, tab],
  )
  const setSort = useCallback((next: SortKey) => write(filters, next, tab), [write, filters, tab])

  useEffect(() => {
    // Matches are members-only, so there is nothing to fetch when signed out.
    if (!auth.isAuthenticated) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`/api/profile/matches?tab=${tab}`)
      .then((r) => r.json())
      .then((data: { results?: PublicProfile[] }) => {
        if (cancelled) return
        // The endpoint returns a paged envelope. Reading `data` as an array
        // here - which it used to be - silently emptied the grid.
        const rows = Array.isArray(data?.results) ? data.results : []
        setEntries(rows.map((profile) => ({ card: toCard(profile), profile })))
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
  }, [auth.isAuthenticated, tab])

  // The badge count is read once per sign-in, not from whichever tab happens to
  // be open.
  useEffect(() => {
    if (!auth.isAuthenticated) return
    let cancelled = false

    fetch('/api/profile/stats')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setNewCount(Number(data?.newMatches ?? 0))
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [auth.isAuthenticated])

  const openTab = (next: MatchTab) => {
    write(filters, sort, next)
    // Marking seen is an explicit POST on opening the tab, never a side effect
    // of the list load - a background refetch would otherwise clear the badge
    // before anything had been read.
    if (next === 'new') {
      fetch('/api/profile/matches/seen', { method: 'POST' })
        .then(() => setNewCount(0))
        .catch(() => {})
    }
  }

  /* Carried into each card so a profile's Back button returns here - to this
     tab and these filters, not just to /matches. */
  const from = currentPath(pathname, params)

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
      <TabStrip
        tabs={MATCH_TABS.map((t) => (t.key === 'new' ? { ...t, count: newCount } : t))}
        active={tab}
        onChange={openTab}
        label="Match lists"
      />

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
          : visible.map((entry) => (
              <ProfileCard key={entry.card.profileId} {...entry.card} from={from} />
            ))}
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
