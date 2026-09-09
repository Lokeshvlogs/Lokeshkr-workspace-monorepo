import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params
  const encoded = encodeURIComponent(profileId)

  // The token is forwarded even though the endpoint stays public: Django shows
  // presence to a signed-in reader and withholds it from an anonymous one, and
  // it cannot tell the two apart without it. A signed-out reader still gets the
  // whole public profile, just no "last seen".
  const { ok, status, data } = await djangoFetch(`/profiles/public/${encoded}`)

  if (ok) {
    // Log the visit for the owner's "who viewed me" list. Sent as a separate
    // authenticated call so the read above stays genuinely public, and awaited
    // so it cannot be cut short when the response is returned. A signed-out
    // reader simply gets a 401 here, which is the correct outcome: there is no
    // visitor to attribute the view to.
    await djangoFetch(`/profiles/view/${encoded}`, { method: 'POST' }).catch(() => {})
  }

  return NextResponse.json(ok ? data : { detail: data.detail ?? 'Profile not found' }, { status })
}
