import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'
import { toMessage } from '@/lib/messaging'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const search = request.nextUrl.searchParams

  // Keyset paging: `before_id` walks backwards, `after_id` polls forwards.
  const query = new URLSearchParams()
  for (const key of ['before_id', 'after_id', 'limit']) {
    const value = search.get(key)
    if (value) query.set(key, value)
  }

  const { ok, data } = await djangoFetch(
    `/messaging/conversations/${encodeURIComponent(id)}/messages?${query}`,
  )
  if (!ok) return NextResponse.json({ results: [], hasMore: false }, { status: 200 })

  return NextResponse.json({
    results: (data?.results ?? []).map(toMessage),
    hasMore: Boolean(data?.has_more),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const { ok, status, data } = await djangoFetch(
    `/messaging/conversations/${encodeURIComponent(id)}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: String(body?.body ?? ''),
        // The idempotency key. A retry over a flaky connection returns the
        // original message rather than posting a second one.
        client_ref: String(body?.clientRef ?? ''),
      }),
    },
  )

  if (!ok) {
    return NextResponse.json({ detail: data?.detail ?? 'Could not send.' }, { status })
  }

  return NextResponse.json(toMessage(data))
}
