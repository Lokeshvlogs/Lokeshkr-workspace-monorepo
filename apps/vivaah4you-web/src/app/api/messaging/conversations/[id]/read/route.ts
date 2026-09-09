import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const { ok, data } = await djangoFetch(
    `/messaging/conversations/${encodeURIComponent(id)}/read`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_message_id: Number(body?.lastMessageId ?? 0) }),
    },
  )

  return NextResponse.json(
    { lastReadMessageId: ok ? (data?.last_read_message_id ?? null) : null },
    { status: 200 },
  )
}
