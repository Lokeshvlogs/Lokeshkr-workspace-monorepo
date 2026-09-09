import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params
  const body = await request.json().catch(() => ({}))

  const { ok, status, data } = await djangoFetch(
    `/interests/send/${encodeURIComponent(profileId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: String(body?.message ?? '') }),
    },
  )

  if (!ok) {
    // Django's refusals are deliberately vague and shared between causes, so
    // they are safe to show verbatim - a distinct "you are blocked" would make
    // blocking detectable by probing.
    return NextResponse.json(
      { detail: data?.detail ?? 'Could not send this right now.' },
      { status },
    )
  }

  return NextResponse.json(
    { id: data?.id ?? null, status: data?.status ?? 'pending', mutual: Boolean(data?.mutual) },
    { status: 200 },
  )
}
