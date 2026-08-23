import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

// The wizard PATCHes one step at a time; Django exposes PATCH only.
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ success: false, detail: 'Invalid request body' }, { status: 400 })
  }

  const { ok, status, data } = await djangoFetch('/profiles/save-step', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

  return NextResponse.json(
    ok ? { success: true, ...data } : { success: false, detail: data.detail ?? 'Could not save this step' },
    { status },
  )
}
