/**
 * Which links a member may attach to a music, film or book pick, and how each
 * one is turned into a title and a piece of artwork.
 *
 * Kept out of `defaults.tsx` because most of it is shared with the browser: the
 * editor needs to know whether a pasted string is worth sending to the unfurl
 * endpoint at all, and the profile view needs the provider label to put on a
 * card. Only `apiFor` and the timeout are server-side concerns.
 *
 * The host lists are mirrored server-side in
 * `services/vivaah4u-api/apps/profiles/constants.py`. That duplication is
 * deliberate: this copy decides what to *fetch*, that copy decides what to
 * *store*, and the stored one is the boundary that actually matters. A member
 * can POST to save-step directly and never touch this file.
 */

export type Provider =
  | 'youtube'
  | 'spotify'
  | 'imdb'
  | 'goodreads'
  | 'googlebooks'
  | 'openlibrary'
  | 'wattpad'

export interface ProviderInfo {
  label: string
  /** Exact hostnames. Never matched by suffix - see `providerFor`. */
  hosts: string[]
}

export const PROVIDERS: Record<Provider, ProviderInfo> = {
  youtube: {
    label: 'YouTube',
    hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'],
  },
  spotify: { label: 'Spotify', hosts: ['open.spotify.com'] },
  imdb: { label: 'IMDb', hosts: ['imdb.com', 'www.imdb.com', 'm.imdb.com'] },
  goodreads: { label: 'Goodreads', hosts: ['goodreads.com', 'www.goodreads.com'] },
  googlebooks: { label: 'Google Books', hosts: ['books.google.com', 'www.google.com'] },
  openlibrary: { label: 'Open Library', hosts: ['openlibrary.org'] },
  wattpad: { label: 'Wattpad', hosts: ['wattpad.com', 'www.wattpad.com'] },
}

/**
 * The provider a URL belongs to, or `null`.
 *
 * The hostname is compared **exactly**, never as a suffix. A suffix test reads
 * as the obvious implementation and accepts `evil-youtube.com` and
 * `youtube.com.attacker.net`, which is the whole attack.
 */
export function providerFor(raw: string): Provider | null {
  let host: string
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'https:') return null
    host = url.hostname.toLowerCase()
  } catch {
    return null
  }

  for (const [provider, info] of Object.entries(PROVIDERS)) {
    if (info.hosts.includes(host)) return provider as Provider
  }
  return null
}

/** Whether a typed string is a link at all, as opposed to a title. */
export function looksLikeUrl(text: string): boolean {
  const trimmed = text.trim()
  return /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)
}

/**
 * Artwork hosts.
 *
 * Separate from the link hosts because artwork comes off a CDN rather than off
 * the site that was linked to. Mirrored server-side as `PICK_IMAGE_HOSTS`.
 */
export const IMAGE_HOSTS = [
  'i.ytimg.com',
  'img.youtube.com',
  'i.scdn.co',
  'mosaic.scdn.co',
  'image-cdn-ak.spotifycdn.com',
  'image-cdn-fa.spotifycdn.com',
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
  'i.gr-assets.com',
  'images.gr-assets.com',
  'books.google.com',
  'books.googleusercontent.com',
  'covers.openlibrary.org',
  'img.wattpad.com',
]

export function allowedImage(raw: string): string {
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'https:') return ''
    return IMAGE_HOSTS.includes(url.hostname.toLowerCase()) ? url.toString() : ''
  } catch {
    return ''
  }
}

/**
 * How long to wait on a third-party host.
 *
 * This is the first outbound call in the app to anything but our own Django
 * service, and nothing else in the repo sets a fetch timeout - so without this
 * a slow remote host holds a route handler open indefinitely.
 */
export const UNFURL_TIMEOUT_MS = 4000

/** Cap on how much of a page is read while looking for its OpenGraph tags. */
export const UNFURL_MAX_BYTES = 256 * 1024

/** How many redirects to follow, each re-checked against the allowlist. */
export const UNFURL_MAX_REDIRECTS = 2

/** A Google Books volume id, from either URL shape the site uses. */
function googleVolumeId(url: string): string {
  try {
    const parsed = new URL(url)
    const query = parsed.searchParams.get('id')
    if (query) return query
    // The newer shape: /books/edition/Some_Title/dCgIzL5sgUsC
    const segments = parsed.pathname.split('/').filter(Boolean)
    const index = segments.indexOf('edition')
    return index >= 0 ? (segments[index + 1] ?? '') : ''
  } catch {
    return ''
  }
}

/**
 * A JSON endpoint that describes the linked thing, when one exists.
 *
 * Three of the seven providers answer a documented, key-less JSON contract, and
 * reading that beats scraping markup every time. The rest fall through to an
 * OpenGraph read:
 *
 *  - Open Library serves usable OpenGraph, so it needs nothing here.
 *  - IMDb and Wattpad sit behind bot detection that answers a server-side fetch
 *    with an interstitial carrying no metadata, and Goodreads does the same
 *    intermittently. Measured, not assumed: Goodreads returned a 2.4 KB wall to
 *    `fetch` while serving the real page to curl minutes apart.
 *
 * Note that Google Books is here on merit but is not dependable in practice:
 * the key-less quota is shared per source IP and is routinely exhausted (a bare
 * 429 from `books.googleapis.com`). It costs nothing to try, and an API key
 * would make it solid, but Reading should not be designed as though it always
 * resolves.
 *
 * Every one of these failures lands in the same place: the pick keeps the title
 * the member typed, or one recovered from the URL slug. That is why
 * `MediaPickField` keeps every title editable rather than treating an unfurl as
 * authoritative.
 */
export function apiFor(provider: Provider, url: string): string | null {
  const target = encodeURIComponent(url)
  if (provider === 'youtube') return `https://www.youtube.com/oembed?url=${target}&format=json`
  if (provider === 'spotify') return `https://open.spotify.com/oembed?url=${target}`
  if (provider === 'googlebooks') {
    const id = googleVolumeId(url)
    return id ? `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(id)}` : null
  }
  return null
}

/** Hostnames a provider's metadata fetch is allowed to touch. */
export function fetchHostsFor(provider: Provider, endpoint: string): string[] {
  const hosts = [...PROVIDERS[provider].hosts]
  try {
    hosts.push(new URL(endpoint).hostname.toLowerCase())
  } catch {
    /* A malformed endpoint simply adds nothing; the fetch will fail anyway. */
  }
  return hosts
}
