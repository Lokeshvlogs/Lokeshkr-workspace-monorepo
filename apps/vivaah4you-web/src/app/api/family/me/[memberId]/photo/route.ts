import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'
import { toFamilyMember } from '@/lib/family'

/**
 * The multipart body is forwarded untouched - re-encoding it here would mean
 * buffering the whole image in this process for no gain.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params
  const form = await request.formData()

  const { ok, status, data } = await djangoFetch(
    `/family/me/${encodeURIComponent(memberId)}/photo`,
    { method: 'POST', body: form },
  )

  if (!ok) {
    return NextResponse.json({ detail: data?.detail ?? 'Could not upload.' }, { status })
  }
  return NextResponse.json(toFamilyMember(data))
}
