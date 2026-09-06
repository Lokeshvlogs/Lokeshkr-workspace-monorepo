import { NextRequest, NextResponse } from "next/server"

import { djangoFetch } from '@/lib/djangoFetch'

/**
 * Typeahead proxy for the institution and employer catalogs.
 *
 * One handler for all three resources because they share a contract; the
 * allow-list is what stops the path segment being used to reach an arbitrary
 * Django route.
 */
const RESOURCES = new Set(['institutions', 'employers', 'visa-statuses'])

/** Query keys forwarded upstream. Anything else is dropped rather than relayed. */
const ALLOWED_PARAMS = ['q', 'country', 'kind', 'profession', 'limit', 'cursor']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource } = await params

  if (!RESOURCES.has(resource)) {
    return NextResponse.json({ detail: 'Unknown catalog resource' }, { status: 404 })
  }

  const incoming = request.nextUrl.searchParams
  const forwarded = new URLSearchParams()
  for (const key of ALLOWED_PARAMS) {
    const value = incoming.get(key)
    if (value) forwarded.set(key, value)
  }

  const query = forwarded.toString()
  const { ok, status, data } = await djangoFetch(
    `/catalog/${resource}${query ? `?${query}` : ''}`,
  )

  if (!ok) {
    // A typeahead that errors should degrade to "no matches", not blow up the
    // form around it. The empty shape matches what the endpoint returns.
    const empty = resource === 'visa-statuses' ? [] : { results: [], has_more: false }
    return NextResponse.json(empty, { status: status === 401 ? 401 : 200 })
  }

  return NextResponse.json(data, { status: 200 })
}
