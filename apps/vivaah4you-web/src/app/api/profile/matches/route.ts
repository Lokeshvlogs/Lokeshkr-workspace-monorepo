import { NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

export async function GET() {
  const { ok, status, data } = await djangoFetch('/profiles/matches')
  // The home page falls back to sample profiles when this is empty or fails,
  // so an error here is returned as an empty list rather than a hard failure.
  return NextResponse.json(ok && Array.isArray(data) ? data : [], { status: ok ? 200 : status })
}
