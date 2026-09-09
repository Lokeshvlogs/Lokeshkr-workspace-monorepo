import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'
import { toConversation } from '@/lib/messaging'

const EMPTY = { results: [], total: 0, hasMore: false }

export async function GET(request: NextRequest) {
  const offset = request.nextUrl.searchParams.get('offset') ?? ''
  const query = offset ? `?offset=${encodeURIComponent(offset)}` : ''

  const { ok, data } = await djangoFetch(`/messaging/conversations${query}`)
  if (!ok) return NextResponse.json(EMPTY, { status: 200 })

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
