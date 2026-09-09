import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'
import { EMPTY_COUNTS, toInterestCounts } from '@/lib/interests'

/** Feeds the navbar badge and the tab headers. */
export async function GET() {
  const { ok, data } = await djangoFetch('/interests/counts')

  // Zeroes rather than an error: a badge that fails to load should disappear,
  // not break the navbar it sits in.
  return NextResponse.json(ok ? toInterestCounts(data) : EMPTY_COUNTS, { status: 200 })
}
