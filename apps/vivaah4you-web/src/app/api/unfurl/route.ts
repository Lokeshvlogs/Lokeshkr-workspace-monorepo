import { NextRequest, NextResponse } from "next/server"

import {
  PROVIDERS,
  UNFURL_MAX_BYTES,
  UNFURL_MAX_REDIRECTS,
  UNFURL_TIMEOUT_MS,
  allowedImage,
  apiFor,
  fetchHostsFor,
  providerFor,
  type Provider,
} from '@/config/linkPreview'

/**
 * Turn a pasted link into a title and a piece of artwork.
 *
 * The one place in this app that fetches a third party. `djangoFetch` cannot be
 * used: it hard-prefixes the Django base URL, attaches our JWT to every request
 * (which would hand our access token to YouTube), and always parses the body as
 * JSON — an OpenGraph read needs the HTML.
 *
 * Modelled on `api/catalog/[resource]/route.ts`, where the same comment
 * applies: the allow-list is what stops this being an open proxy. A URL that is
 * not on it is never fetched at all.
 *
 * **Always answers 200.** A dead link, a blocked scrape or a slow host is a
 * normal outcome here, not an error — the member still gets to keep the title
 * they typed, and an error status would make the editor look broken for
 * something that is working as designed.
 */

interface Unfurled {
  title: string
  subtitle: string
  thumbnail: string
  provider: Provider | ''
}

const EMPTY: Unfurled = { title: '', subtitle: '', thumbnail: '', provider: '' }

/* A browser-ish UA. Several of these hosts serve nothing useful to a client
   that does not look like a browser, and the request is a plain public GET. */
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; Vivah4U link preview; +https://vivah4u.example/about/link-previews)',
  Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en',
}

/**
 * Fetch, following redirects by hand so every hop is re-checked.
 *
 * `redirect: 'follow'` would let an allow-listed host bounce the request to an
 * internal address — the allow-list would have been checked once, on a URL that
 * is not the one finally fetched.
 */
async function fetchChecked(url: string, hosts: string[]): Promise<Response | null> {
  let current = url

  for (let hop = 0; hop <= UNFURL_MAX_REDIRECTS; hop += 1) {
    let response: Response
    try {
      response = await fetch(current, {
        headers: HEADERS,
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(UNFURL_TIMEOUT_MS),
      })
    } catch {
      return null
    }

    if (response.status < 300 || response.status >= 400) {
      return response.ok ? response : null
    }

    const location = response.headers.get('location')
    if (!location) return null

    // Resolved against the current URL so a relative Location works, then put
    // back through the same allow-list as the original.
    let next: string
    let host: string
    try {
      const resolved = new URL(location, current)
      if (resolved.protocol !== 'https:') return null
      next = resolved.toString()
      host = resolved.hostname.toLowerCase()
    } catch {
      return null
    }
    if (!hosts.includes(host)) return null
    current = next
  }

  return null
}

/** Read at most `UNFURL_MAX_BYTES`, so a huge page cannot exhaust memory. */
async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ''

  const decoder = new TextDecoder()
  let out = ''
  let read = 0

  while (read < UNFURL_MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    read += value.byteLength
    out += decoder.decode(value, { stream: true })
    // Everything wanted lives in <head>; the rest of the document is weight.
    if (out.includes('</head>')) break
  }

  reader.cancel().catch(() => {})
  return out
}

const decodeEntities = (text: string): string =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()

/**
 * One OpenGraph (or twitter:) value.
 *
 * Attribute order is not fixed in real markup — `content` comes before
 * `property` on plenty of sites — so both orders are tried rather than assuming
 * the tidy one.
 */
function metaContent(html: string, names: string[]): string {
  for (const name of names) {
    const escaped = name.replace(/[:]/g, '\\:')
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) return decodeEntities(match[1])
    }
  }
  return ''
}

function titleTag(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i)
  return match?.[1] ? decodeEntities(match[1]) : ''
}

/**
 * Drop a trailing " | Site Name" from an OpenGraph title.
 *
 * Open Library sends "Fantastic Mr Fox by Roald Dahl | Open Library", and the
 * site name is already on the card's provider chip - printing it twice inside a
 * two-line clamp costs a line that the actual title needs.
 */
function trimSiteSuffix(title: string, site: string): string {
  if (!site) return title
  const suffix = new RegExp(`\\s*[|\\u2013\\u2014-]\\s*${site.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*$`, 'i')
  return title.replace(suffix, '').trim() || title
}

/** A documented JSON contract, so no parsing guesswork. */
async function viaApi(provider: Provider, url: string): Promise<Unfurled | null> {
  const endpoint = apiFor(provider, url)
  if (!endpoint) return null

  const response = await fetchChecked(endpoint, fetchHostsFor(provider, endpoint))
  if (!response) return null

  const data = await response.json().catch(() => null)
  if (!data) return null

  // A 200 with no title is not a usable answer. Returning it anyway would
  // satisfy the `??` below and skip the OpenGraph attempt that might have
  // worked.
  // oEmbed and the Google Books volume both describe one thing, in different
  // words. Normalised here so the caller never branches on provider.
  const volume = data.volumeInfo ?? null
  const title = String(volume?.title ?? data.title ?? '').trim()
  if (!title) return null

  const authors: string[] = Array.isArray(volume?.authors) ? volume.authors : []

  return {
    title,
    subtitle: authors.join(', ').trim() || String(data.author_name ?? '').trim(),
    thumbnail: allowedImage(
      // Google Books serves http:// image links even over https. Upgraded
      // rather than dropped, since the host itself is one we accept.
      String(volume?.imageLinks?.thumbnail ?? data.thumbnail_url ?? '').replace(/^http:\/\//, 'https://'),
    ),
    provider,
  }
}

/** OpenGraph: the fallback for hosts with no oEmbed. Often blocked. */
async function viaOpenGraph(provider: Provider, url: string): Promise<Unfurled | null> {
  const response = await fetchChecked(url, [...PROVIDERS[provider].hosts])
  if (!response) return null

  const html = await readCapped(response).catch(() => '')
  if (!html) return null

  const site = metaContent(html, ['og:site_name'])
  const found = metaContent(html, ['og:title', 'twitter:title']) || titleTag(html)
  if (!found) return null

  return {
    title: trimSiteSuffix(found, site),
    // Left empty rather than filled with the site name: that is already on the
    // card's provider chip, and og:description is a full synopsis - far too
    // much for a one-line caption.
    subtitle: '',
    thumbnail: allowedImage(metaContent(html, ['og:image', 'twitter:image'])),
    provider,
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const url = String(body?.url ?? '').trim()

  const provider = providerFor(url)
  if (!provider) {
    // Not a link we recognise. Nothing is fetched — this is the allow-list
    // doing its job, not a failure.
    return NextResponse.json(EMPTY)
  }

  try {
    const result = (await viaApi(provider, url)) ?? (await viaOpenGraph(provider, url))
    // The provider is reported even when the fetch failed, so the editor can
    // still show "IMDb" beside the title the member typed.
    return NextResponse.json(result ?? { ...EMPTY, provider })
  } catch {
    return NextResponse.json({ ...EMPTY, provider })
  }
}
