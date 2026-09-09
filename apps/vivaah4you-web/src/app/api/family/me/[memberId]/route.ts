import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'
import { toFamilyMember } from '@/lib/family'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params
  const body = await request.json().catch(() => ({}))

  const { ok, status, data } = await djangoFetch(
    `/family/me/${encodeURIComponent(memberId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        relation: String(body?.relation ?? ''),
        name: String(body?.name ?? ''),
        occupation: String(body?.occupation ?? ''),
        about: String(body?.about ?? ''),
        is_married: Boolean(body?.isMarried),
        position: Number(body?.position ?? 0),
      }),
    },
  )

  if (!ok) {
    return NextResponse.json({ detail: data?.detail ?? 'Could not save.' }, { status })
  }
  return NextResponse.json(toFamilyMember(data))
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params
  const { ok, status } = await djangoFetch(`/family/me/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  })
  return NextResponse.json({ removed: ok }, { status: ok ? 200 : status })
}
