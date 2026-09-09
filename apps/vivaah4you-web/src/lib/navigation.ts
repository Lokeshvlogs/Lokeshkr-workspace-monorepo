/**
 * Where a profile page goes back to.
 *
 * A profile is reachable from four lists and a chat thread, so "back" has to be
 * told where it came from. The origin travels as a `?from=` path rather than
 * relying on `router.back()`, which does the wrong thing in the case that
 * matters most: someone opening a shared profile link in a fresh tab, where
 * going back leaves the site entirely.
 */

export interface BackTarget {
  href: string
  label: string
}

/**
 * Origins a profile may claim to have come from.
 *
 * A whitelist, not a sanitiser: `?from=` arrives from the URL bar, and echoing
 * an unchecked value into a link is an open redirect. Anything not listed here
 * falls back to the dashboard.
 */
const ORIGINS: Record<string, string> = {
  '/': 'dashboard',
  '/matches': 'matches',
  '/visitors': 'visitors',
  '/interests': 'interests',
}

export const DEFAULT_BACK: BackTarget = { href: '/', label: 'Back to dashboard' }

/**
 * Read a `?from=` value into something safe to render and link to.
 *
 * The query string of the origin is preserved when it is present, so returning
 * to a filtered list lands back on the same filters - but only after the path
 * itself has been matched against the whitelist.
 */
export function backTarget(from: string | null | undefined): BackTarget {
  if (!from || !from.startsWith('/')) return DEFAULT_BACK

  // Split before matching: `/matches?religion=hindu` must be recognised as
  // `/matches`, and a whitelist that ignored the query would never match.
  const [path, query] = from.split('?')
  const name = ORIGINS[path]
  if (!name) return DEFAULT_BACK

  return {
    href: query ? `${path}?${query}` : path,
    label: `Back to ${name}`,
  }
}

/**
 * A link to a profile that remembers where it was opened from.
 *
 * `from` is normally `usePathname() + useSearchParams()`, so a filtered list
 * returns to its own filters.
 */
export function profileHref(profileId: string, from?: string): string {
  const base = `/profile/${encodeURIComponent(profileId)}`
  return from ? `${base}?from=${encodeURIComponent(from)}` : base
}

/** `usePathname()` and `useSearchParams()` recombined into one `from` value. */
export function currentPath(pathname: string, params?: URLSearchParams | null): string {
  const query = params?.toString()
  return query ? `${pathname}?${query}` : pathname
}
