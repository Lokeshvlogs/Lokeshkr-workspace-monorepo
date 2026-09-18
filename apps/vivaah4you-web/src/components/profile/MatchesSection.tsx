'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import ProfileCard, { type ProfileCardData } from '@/components/profile/ProfileCard'
import MatchSearchBar, { type SortKey } from '@/components/profile/MatchSearchBar'
import {
  emptyFilters,
  filtersFromParams,
  paramsFromFilters,
  type MatchFilters,
} from '@/lib/matchFilters'
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
  /* Profession alone. Education used to be joined on with " · ", and since the
     headline is a single truncate() line it was usually the half that got cut
     off - on a card in a four-column grid, always. It has its own line now. */
  headline: labelFor('profession', profile.profession),
  education: labelFor('educationLevel', profile.educationLevel),
  // A stored bucket slug ("25-50"); labelFor turns it into "25-50 lacs".
  salary: labelFor('salaryAmount', profile.salaryAmount),
  // Computed by the API, never re-derived here. See apps/profiles/residency.py.
  isNri: profile.isNri,
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

/**
 * Filtering and sorting happen on the SERVER now.
 *
 * They used to happen here, in the browser, over a single unpaged fetch - which
 * meant they only ever searched the first page of profiles Django happened to
 * return. A filter that finds nothing because the matching member was never
 * fetched looks identical to a filter that finds nothing because nobody
 * matches, which is what made it worth moving.
 */

type MatchTab = 'all' | 'new' | 'recent'

const MATCH_TABS: readonly TabDef<MatchTab>[] = [
  { key: 'all', label: 'All matches' },
  { key: 'new', label: 'New' },
  { key: 'recent', label: 'Recently joined' },
]

function MatchSkeleton() {
  return (
    <div className="match-skeleton" aria-hidden="true">
      <div className="match-skeleton-media" />
      <div className="match-skeleton-line" />
      <div className="match-skeleton-line match-skeleton-line-short" />
      <div className="match-skeleton-line match-skeleton-line-short" />
    </div>
  )
}

/**
 * Filters and sort live in the query string.
 *
 * They used to be component state, which survived opening a profile only
 * because the grid was never unmounted - it sat behind a `hidden` class in the
 * dashboard. On its own route it unmounts, and state would be lost on every
 * Back. The URL restores it for free, and makes a filtered search shareable -
 * which is what the profile tags rely on.
 */

/** Everything the URL carries, as one query string. */
function queryFor(filters: MatchFilters, sort: SortKey, tab: MatchTab): string {
  const params = paramsFromFilters(filters)
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
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  /* Held separately from `entries` so the badge does not drop to zero the
     moment the member opens the New tab and the list is replaced. */
  const [newCount, setNewCount] = useState(0)

  const filters = useMemo(() => filtersFromParams(params), [params])
  /* A string, so the fetch effect has something React can compare. The filters
     object is rebuilt every render and would refetch forever as a dependency. */
  const search = useMemo(() => paramsFromFilters(filters).toString(), [filters])
  const sort = (params.get('sort') as SortKey) || 'best'
  const rawTab = params.get('tab')
  const tab: MatchTab = rawTab === 'new' || rawTab === 'recent' ? rawTab : 'all'

  /* `replace`, not `push`: typing in the search box must not fill the history
     stack with a step per keystroke. */
  const write = useCallback(
    (nextFilters: MatchFilters, nextSort: SortKey, nextTab: MatchTab) => {
      const query = queryFor(nextFilters, nextSort, nextTab)
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

    // 48 is the endpoint's cap. Paging beyond it is a separate job; what
    // matters here is that the SERVER decides which 48, having applied the
    // filters to every member rather than to whichever twelve arrived first.
    const query = queryFor(filters, sort, tab)
    fetch(`/api/profile/matches?${query}${query ? '&' : ''}limit=48`)
      .then((r) => r.json())
      .then((data: { results?: PublicProfile[]; total?: number }) => {
        if (cancelled) return
        // The endpoint returns a paged envelope. Reading `data` as an array
        // here - which it used to be - silently emptied the grid.
        const rows = Array.isArray(data?.results) ? data.results : []
        setEntries(rows.map((profile) => ({ card: toCard(profile), profile })))
        setTotal(Number(data?.total ?? rows.length))
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
    // `search` rather than the filters object: it is a string, so React can
    // compare it, and a new object identity every render would refetch forever.
  }, [auth.isAuthenticated, tab, sort, search])

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

  // Already filtered and ordered by the server - nothing left to do here.
  const visible = entries

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
        resultCount={total}
      />

      <div className="match-grid mt-6">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <MatchSkeleton key={i} />)
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
            onClick={() => setFilters(emptyFilters())}
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  )
}
