/**
 * Client for the institution / employer catalog.
 *
 * These lists replace the hardcoded `collegeOptions` in
 * constants/selectOptions/career.ts: a real institution list is far too large
 * to ship to the browser, and it carries an internal reputation tier that must
 * stay on the server. The endpoint returns only what is safe to display.
 */

export interface CatalogItem {
  slug: string
  name: string
  country: string
  city?: string
  kind?: string
}

export interface CatalogPage {
  results: CatalogItem[]
  next_cursor?: number | null
  has_more?: boolean
}

export interface SelectOptionLike {
  value: string
  label: string
}

async function fetchCatalog(
  resource: 'institutions' | 'employers',
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<CatalogPage> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }

  try {
    const response = await fetch(`/api/catalog/${resource}?${query}`, { signal })
    if (!response.ok) return { results: [] }
    return (await response.json()) as CatalogPage
  } catch {
    // Includes the AbortError from a superseded keystroke, which is expected
    // rather than exceptional.
    return { results: [] }
  }
}

export function searchInstitutions(
  query: string,
  country?: string,
  kind?: string,
  signal?: AbortSignal,
): Promise<CatalogPage> {
  return fetchCatalog('institutions', { q: query, country, kind }, signal)
}

export function searchEmployers(
  query: string,
  country?: string,
  profession?: string,
  signal?: AbortSignal,
): Promise<CatalogPage> {
  return fetchCatalog('employers', { q: query, country, profession }, signal)
}

export async function visaStatusesFor(country: string): Promise<SelectOptionLike[]> {
  try {
    const response = await fetch(`/api/catalog/visa-statuses?country=${encodeURIComponent(country)}`)
    if (!response.ok) return []
    return (await response.json()) as SelectOptionLike[]
  } catch {
    return []
  }
}

/**
 * Catalog rows as dropdown options.
 *
 * The city is appended as a disambiguator rather than folded into the value:
 * several countries have more than one "University of X", and the slug stays
 * the thing actually stored.
 */
export function toOptions(items: CatalogItem[]): SelectOptionLike[] {
  return items.map((item) => ({
    value: item.slug,
    label: item.city ? `${item.name} — ${item.city}` : item.name,
  }))
}
