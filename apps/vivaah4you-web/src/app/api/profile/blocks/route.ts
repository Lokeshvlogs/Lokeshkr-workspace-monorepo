import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/** Everyone this member has blocked. Their own list, never anyone else's. */
export async function GET() {
  const { ok, status, data } = await djangoFetch('/blocks')

  if (!ok) {
    return NextResponse.json(
      { detail: data?.detail ?? 'Could not load your blocked members.' },
      { status },
    )
  }

  return NextResponse.json(
    { results: data?.results ?? [], total: Number(data?.total ?? 0) },
    { status: 200 },
  )
}
