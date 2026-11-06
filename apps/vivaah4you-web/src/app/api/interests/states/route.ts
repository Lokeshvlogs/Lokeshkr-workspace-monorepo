import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/**
 * Where the member stands with everyone they have an interest with, keyed by
 * public profile id. Read once per page so a grid of cards can paint Connect /
 * Pending / Chat / Declined without a request each.
 */
export async function GET() {
  const { ok, status, data } = await djangoFetch('/interests/states')

  if (!ok) {
    return NextResponse.json(
      { detail: data?.detail ?? 'Could not load your connections.' },
      { status },
    )
  }

  return NextResponse.json({ states: data?.states ?? {} }, { status: 200 })
}
