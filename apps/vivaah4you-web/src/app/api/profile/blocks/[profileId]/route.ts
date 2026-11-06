import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/** Both verbs do the same hop; only the method and the resulting state differ. */
async function toggle(profileId: string, method: 'POST' | 'DELETE') {
  const { ok, status, data } = await djangoFetch(
    `/blocks/${encodeURIComponent(profileId)}`,
    { method },
  )

  if (!ok) {
    return NextResponse.json(
      { detail: data?.detail ?? 'Could not update this block.' },
      { status },
    )
  }

  return NextResponse.json({ blocked: Boolean(data?.blocked) }, { status: 200 })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params
  return toggle(profileId, 'POST')
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params
  return toggle(profileId, 'DELETE')
}
