import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'
import { toFamilyMember } from '@/lib/family'

export async function GET() {
  const { ok, data } = await djangoFetch('/family/me')
  return NextResponse.json(
    { results: ok ? (data?.results ?? []).map(toFamilyMember) : [] },
    { status: 200 },
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const { ok, status, data } = await djangoFetch('/family/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      relation: String(body?.relation ?? ''),
      name: String(body?.name ?? ''),
      occupation: String(body?.occupation ?? ''),
      about: String(body?.about ?? ''),
      is_married: Boolean(body?.isMarried),
      position: Number(body?.position ?? 0),
    }),
  })

  if (!ok) {
    return NextResponse.json({ detail: data?.detail ?? 'Could not add them.' }, { status })
  }
  return NextResponse.json(toFamilyMember(data))
}
