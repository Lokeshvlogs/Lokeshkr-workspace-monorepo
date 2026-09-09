import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'
import { toFamilyMember } from '@/lib/family'

/** Somebody else's family. Hidden profiles 404, exactly as their profile does. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params
  const { ok, data } = await djangoFetch(`/family/${encodeURIComponent(profileId)}`)

  return NextResponse.json(
    { results: ok ? (data?.results ?? []).map(toFamilyMember) : [] },
    { status: 200 },
  )
}
