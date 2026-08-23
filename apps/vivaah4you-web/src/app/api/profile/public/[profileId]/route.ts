import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params
  // Public page - no auth token attached.
  const { ok, status, data } = await djangoFetch(
    `/profiles/public/${encodeURIComponent(profileId)}`,
    {},
    false,
  )
  return NextResponse.json(ok ? data : { detail: data.detail ?? 'Profile not found' }, { status })
}
