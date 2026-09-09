import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/**
 * The cheapest endpoint in the stack - no message bodies, just what moved.
 *
 * Kept a pure passthrough on purpose: every client hits this on a timer, and
 * the browser -> Next -> Django hop is already two requests per tick.
 */
export async function GET() {
  const { ok, data } = await djangoFetch('/messaging/poll')
  if (!ok) return NextResponse.json({ unreadTotal: 0, conversations: [] }, { status: 200 })

  return NextResponse.json({
    unreadTotal: Number(data?.unread_total ?? 0),
    conversations: (data?.conversations ?? []).map((row: any) => ({
      id: String(row?.id ?? ''),
      lastMessageAt: row?.last_message_at ?? null,
      unread: Number(row?.unread ?? 0),
    })),
  })
}
