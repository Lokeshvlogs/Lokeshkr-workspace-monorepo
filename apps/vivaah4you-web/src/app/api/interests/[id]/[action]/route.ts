import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/** Whitelisted, so the path segment can never be used to reach another route. */
const ACTIONS = new Set(['accept', 'decline', 'withdraw'])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await params

  if (!ACTIONS.has(action)) {
    return NextResponse.json({ detail: 'Unknown action.' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))

  const { ok, status, data } = await djangoFetch(
    `/interests/${encodeURIComponent(id)}/${action}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'decline' ? { block: Boolean(body?.block) } : {}),
    },
  )

  if (!ok) {
    return NextResponse.json(
      { detail: data?.detail ?? 'Could not do that right now.' },
      { status },
    )
  }

  return NextResponse.json({ id: data?.id ?? null, status: data?.status ?? '' }, { status: 200 })
}
