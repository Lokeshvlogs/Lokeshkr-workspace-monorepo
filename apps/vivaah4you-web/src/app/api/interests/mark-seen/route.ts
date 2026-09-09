import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/** Clears the unseen dot. Deliberately separate from reading the list. */
export async function POST() {
  const { ok, data } = await djangoFetch('/interests/mark-seen', { method: 'POST' })
  return NextResponse.json({ seen: ok ? Number(data?.seen ?? 0) : 0 }, { status: 200 })
}
