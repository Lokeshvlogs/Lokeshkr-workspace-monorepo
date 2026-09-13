import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

const TABS = new Set(['all', 'new', 'recent'])

/**
 * Filters forwarded to Django.
 *
 * An allowlist rather than a blind forward: this route builds a query string
 * for an internal service, and anything not named here has no business being
 * injected into it. Adding a filter means adding it in three places on purpose
 * - the schema, this set, and the client - so none of them drifts silently.
 */
const FORWARDED = new Set([
  'q',
  'religion',
  'maritalStatus',
  'country',
  'city',
  'state',
  'motherTongue',
  'community',
  'education',
  'profession',
  'diet',
  'salary',
  'citizenship',
  'visa',
  'nri',
  'ageMin',
  'ageMax',
  'heightMin',
  'heightMax',
  'sort',
])

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const tab = params.get('tab') ?? 'all'
  const limit = params.get('limit') ?? ''
  const offset = params.get('offset') ?? ''

  const query = new URLSearchParams({ tab: TABS.has(tab) ? tab : 'all' })
  if (limit) query.set('limit', limit)
  if (offset) query.set('offset', offset)

  // `entries()` yields one pair per repeat and `append` keeps them, which is
  // what makes multi-value filters survive the hop. `set` would collapse
  // "community=iyer&community=nair" to the last one.
  for (const [key, value] of params.entries()) {
    if (FORWARDED.has(key) && value) query.append(key, value)
  }

  const { ok, status, data } = await djangoFetch(`/profiles/matches?${query}`)

  // Both shapes are accepted deliberately. Django now returns a paged envelope,
  // but it used to return a bare array - and because the old handler did
  // `Array.isArray(data) ? data : []`, a service deployed ahead of the other
  // would have emptied the dashboard with no error anywhere. Tolerating both
  // means the deploy order of the two services does not matter.
  const rows = Array.isArray(data) ? data : (data?.results ?? [])

  // The home page falls back to sample profiles when this is empty or fails,
  // so an error here is returned as an empty page rather than a hard failure.
  return NextResponse.json(
    {
      results: ok ? rows : [],
      total: ok ? (data?.total ?? rows.length) : 0,
      hasMore: ok ? Boolean(data?.has_more) : false,
    },
    { status: ok ? 200 : status },
  )
}
