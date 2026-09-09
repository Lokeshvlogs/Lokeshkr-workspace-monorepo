import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

const TABS = new Set(['all', 'new', 'recent'])

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const tab = params.get('tab') ?? 'all'
  const limit = params.get('limit') ?? ''
  const offset = params.get('offset') ?? ''

  const query = new URLSearchParams({ tab: TABS.has(tab) ? tab : 'all' })
  if (limit) query.set('limit', limit)
  if (offset) query.set('offset', offset)

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
