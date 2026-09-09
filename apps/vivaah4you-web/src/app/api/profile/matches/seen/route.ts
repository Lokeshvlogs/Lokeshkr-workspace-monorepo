import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/**
 * Moves the "new matches" marker to now.
 *
 * A POST, never a side effect of loading the list: a StrictMode double-render
 * or a background refetch would otherwise clear the badge before the member
 * had seen anything.
 */
export async function POST() {
  const { ok, data } = await djangoFetch('/profiles/matches/seen', { method: 'POST' })
  return NextResponse.json({ seenAt: ok ? (data?.seen_at ?? null) : null }, { status: 200 })
}
