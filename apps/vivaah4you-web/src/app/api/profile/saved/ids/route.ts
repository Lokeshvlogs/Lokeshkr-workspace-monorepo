import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/**
 * The profile ids this member has saved.
 *
 * Ids, not cards: the match grid already holds the profiles it is drawing and
 * only needs to know which of them to paint a filled bookmark on.
 */
export async function GET() {
  const { ok, status, data } = await djangoFetch('/saved/ids')

  if (!ok) {
    return NextResponse.json(
      { detail: data?.detail ?? 'Could not load your saved profiles.' },
      { status },
    )
  }

  const ids = Array.isArray(data?.ids) ? data.ids.map(String) : []
  return NextResponse.json({ ids }, { status: 200 })
}
