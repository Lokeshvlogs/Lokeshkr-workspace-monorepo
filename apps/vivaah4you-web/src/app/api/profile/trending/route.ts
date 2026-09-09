import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

const TABS = new Set(['trending', 'online', 'new'])

/** The rail on the matches view. Small, and safe to fail quietly. */
export async function GET(request: NextRequest) {
  const asked = request.nextUrl.searchParams.get('tab') ?? 'trending'
  const tab = TABS.has(asked) ? asked : 'trending'

  const { ok, data } = await djangoFetch(`/profiles/trending?tab=${tab}`)

  // The rail is a garnish on a page that works without it, so a failure hides
  // it rather than breaking the matches grid underneath.
  return NextResponse.json({ results: ok ? (data?.results ?? []) : [] }, { status: 200 })
}
