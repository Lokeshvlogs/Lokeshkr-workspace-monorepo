import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'
import { toInterestRow } from '@/lib/interests'

const TABS = new Set(['received', 'sent', 'accepted', 'declined'])

/** One page of an interests tab, reshaped to camelCase for the browser. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const tab = params.get('tab') ?? 'received'
  const offset = params.get('offset') ?? ''

  const query = new URLSearchParams({ tab: TABS.has(tab) ? tab : 'received' })
  if (offset) query.set('offset', offset)

  const { ok, status, data } = await djangoFetch(`/interests?${query}`)

  // The inbox renders its own empty state, which reads the same as "nothing
  // here yet" - so a failure degrades rather than breaking the page.
  if (!ok) {
    return NextResponse.json({ results: [], total: 0, hasMore: false }, { status })
  }

  return NextResponse.json({
    results: (data?.results ?? []).map(toInterestRow),
    total: Number(data?.total ?? 0),
    hasMore: Boolean(data?.has_more),
  })
}
