import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/** The chat thread for a mutual pair, opened on demand if the accept missed it. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params

  const { ok, status, data } = await djangoFetch(
    `/interests/conversation/${encodeURIComponent(profileId)}`,
    { method: 'POST' },
  )

  if (!ok) {
    return NextResponse.json(
      { detail: data?.detail ?? 'Could not open this chat.' },
      { status },
    )
  }

  return NextResponse.json({ id: String(data?.id ?? '') }, { status: 200 })
}
