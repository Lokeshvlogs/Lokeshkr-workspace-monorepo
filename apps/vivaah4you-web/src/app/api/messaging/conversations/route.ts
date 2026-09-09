import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'
import { toConversation } from '@/lib/messaging'

const EMPTY = { results: [], total: 0, hasMore: false }

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams
  const forwarded = new URLSearchParams()
  for (const key of ['limit', 'offset']) {
    const value = search.get(key)
    if (value) forwarded.set(key, value)
  }
  const query = forwarded.toString() ? `?${forwarded}` : ''

  const { ok, status, data } = await djangoFetch(`/messaging/conversations${query}`)

  // The status is passed through rather than flattened to 200. This used to
  // answer 200 with an empty list on any failure, so a backend outage was
  // indistinguishable from having no chats - and the drawer said "No chats
  // yet. A chat opens as soon as an interest is accepted."
  if (!ok) return NextResponse.json(EMPTY, { status })

  return NextResponse.json({
    results: (data?.results ?? []).map(toConversation),
    total: Number(data?.total ?? 0),
    hasMore: Boolean(data?.has_more),
  })
}

/** Opening a thread. Django refuses unless the interest was accepted. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { ok, status, data } = await djangoFetch('/messaging/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participant_ids: body?.participantIds ?? [],
      kind: body?.kind ?? 'match',
      context_ref: body?.contextRef ?? '',
    }),
  })

  if (!ok) {
    return NextResponse.json(
      { detail: data?.detail ?? 'Could not open this conversation.' },
      { status },
    )
  }

  return NextResponse.json(toConversation(data))
}
