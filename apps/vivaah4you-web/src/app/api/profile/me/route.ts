import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

export async function GET() {
  const { ok, status, data } = await djangoFetch('/profiles/me')
  return NextResponse.json(ok ? data : { detail: data.detail ?? 'Could not load profile' }, { status })
}
