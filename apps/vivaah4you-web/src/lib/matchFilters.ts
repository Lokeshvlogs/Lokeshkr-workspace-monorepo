import { labelFor } from '@/lib/profileDisplay'
import type { MyProfile } from '@/types/profile'

/**
 * The shape of a match search, and how it travels in the URL.
 *
 * Filters are mixed-arity: ranges and free text hold one value, everything else
 * holds a set. That is not a flourish - the member's own partner preferences
 * are multi-valued lists (`partnerCommunities`, `partnerCountries`, …), and
 * seeding a search from them is the whole point of the hero tags.
 */

export const SCALAR_KEYS = ['query', 'ageMin', 'ageMax', 'heightMin', 'heightMax', 'nri'] as const
export const MULTI_KEYS = [
  'religion',
  'maritalStatus',
  'country',
  'state',
  'city',
  'motherTongue',
  'community',
  'education',
  'profession',
  'diet',
  'salary',
  'citizenship',
] as const

export type ScalarKey = (typeof SCALAR_KEYS)[number]
export type MultiKey = (typeof MULTI_KEYS)[number]

export type MatchFilters = Record<ScalarKey, string> & Record<MultiKey, string[]>

/**
 * A FACTORY, not a shared constant.
 *
 * The previous `EMPTY_FILTERS` object was spread with `{ ...EMPTY_FILTERS }`,
 * which is a shallow copy. Now that half the values are arrays, every caller of
 * a shared constant would hold the *same* array instances, and one `push` would
 * corrupt the module for everyone.
 */
export function emptyFilters(): MatchFilters {
  const next = {} as MatchFilters
  for (const key of SCALAR_KEYS) next[key] = ''
  for (const key of MULTI_KEYS) next[key] = []
  return next
}

export function isEmpty(filters: MatchFilters): boolean {
  return (
    SCALAR_KEYS.every((key) => !filters[key]) && MULTI_KEYS.every((key) => filters[key].length === 0)
  )
}

export function countActive(filters: MatchFilters): number {
  return (
    SCALAR_KEYS.filter((key) => filters[key]).length +
    MULTI_KEYS.reduce((total, key) => total + filters[key].length, 0)
  )
}

// --- The URL codec ----------------------------------------------------------

export function filtersFromParams(params: URLSearchParams): MatchFilters {
  const next = emptyFilters()
  for (const key of SCALAR_KEYS) {
    const value = params.get(key)
    if (value) next[key] = value
  }
  for (const key of MULTI_KEYS) {
    // Repeated keys, never a comma-joined string: `city` values are composed
    // labels that CONTAIN commas ("Mumbai, Maharashtra, India"), so a comma
    // encoding would need escaping at both ends.
    const values = Array.from(new Set(params.getAll(key).filter(Boolean)))
    if (values.length) next[key] = values
  }
  return next
}

export function paramsFromFilters(filters: MatchFilters): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of SCALAR_KEYS) {
    if (filters[key]) params.set(key, filters[key])
  }
  for (const key of MULTI_KEYS) {
    // `append`, and never a hand-built template string: a literal `+` in
    // `salary=500+` decodes to a space, and URLSearchParams escapes it.
    for (const value of filters[key]) params.append(key, value)
  }
  return params
}

// --- Labels -----------------------------------------------------------------

/** Filter key -> the profile field key `labelFor` knows it by. */
const LABEL_FIELD: Partial<Record<MultiKey, string>> = {
  country: 'currentCountry',
  citizenship: 'citizenshipCountry',
  motherTongue: 'mothertongue',
  education: 'educationLevel',
  salary: 'salaryAmount',
  city: 'currentCity',
  state: 'currentState',
}

export const FILTER_LABELS: Record<ScalarKey | MultiKey, string> = {
  query: 'Search',
  ageMin: 'Age from',
  ageMax: 'Age to',
  heightMin: 'Height from',
  heightMax: 'Height to',
  nri: 'Living abroad',
  religion: 'Religion',
  maritalStatus: 'Marital status',
  country: 'Country',
  state: 'State',
  city: 'Lives in',
  motherTongue: 'Mother tongue',
  community: 'Community',
  education: 'Education',
  profession: 'Profession',
  diet: 'Diet',
  salary: 'Income',
  citizenship: 'Citizen of',
}

/** What one chip reads after its field name. */
export function chipValue(key: ScalarKey | MultiKey, value: string): string {
  if (key === 'nri') return value === '1' ? 'Yes' : 'No'
  const field = LABEL_FIELD[key as MultiKey] ?? key
  return labelFor(field, value) || value
}

// --- Seeding from the member's own preferences -------------------------------

/** partner preference -> the filter it seeds. */
const PREFERENCE_TO_FILTER: Array<[keyof MyProfile, MultiKey]> = [
  ['partnerReligions', 'religion'],
  ['partnerMaritalStatuses', 'maritalStatus'],
  ['partnerCountries', 'country'],
  ['partnerMotherTongues', 'motherTongue'],
  ['partnerCommunities', 'community'],
  ['partnerEducations', 'education'],
  ['partnerProfessions', 'profession'],
  ['partnerDiets', 'diet'],
]

/**
 * The member's saved partner preferences, as search filters.
 *
 * Preferences have never narrowed a search before - they only fed the
 * compatibility score - so this is the first thing that turns them into
 * results. They arrive as visible, removable chips rather than an invisible
 * baseline, which is the difference between a member understanding why they
 * are seeing ten profiles and concluding that search is broken.
 */
export function seedFiltersFrom(me: MyProfile | null | undefined): MatchFilters {
  const filters = emptyFilters()
  if (!me) return filters

  for (const [preference, key] of PREFERENCE_TO_FILTER) {
    const raw = me[preference]
    if (!Array.isArray(raw)) continue
    // 'any' is how a dropdown says "no preference"; it is stripped on the way
    // into the database, but an older row may still carry it.
    const values = raw.map(String).filter((value) => value && value !== 'any')
    if (values.length) filters[key] = Array.from(new Set(values))
  }

  if (me.partnerAgeMin) filters.ageMin = String(me.partnerAgeMin)
  if (me.partnerAgeMax) filters.ageMax = String(me.partnerAgeMax)
  // Already total inches, which is the unit heightMin/heightMax compare in.
  if (me.partnerHeightMin) filters.heightMin = String(me.partnerHeightMin)
  if (me.partnerHeightMax) filters.heightMax = String(me.partnerHeightMax)

  return filters
}

/**
 * Where a profile tag points: the member's preferences, plus that tag.
 *
 * Two rules, and both exist because the obvious version is useless:
 *
 * 1. **The tag REPLACES its own axis rather than joining it.** Clicking
 *    "Bengaluru" on a profile means "show me people there", not "people in
 *    Bengaluru who are also in the four cities I saved".
 * 2. **`nri` clears the seeded country.** Most members' `partnerCountries` is
 *    `['IN']` or empty, so "living abroad AND in India" returns nothing at all -
 *    and nothing on screen would explain why.
 */
export function tagSearchHref(
  filter: { param: string; value: string },
  me: MyProfile | null | undefined,
): string {
  const filters = seedFiltersFrom(me)
  const key = filter.param as ScalarKey | MultiKey

  if ((MULTI_KEYS as readonly string[]).includes(key)) {
    filters[key as MultiKey] = [filter.value]
  } else if ((SCALAR_KEYS as readonly string[]).includes(key)) {
    filters[key as ScalarKey] = filter.value
  }

  if (key === 'nri' && filter.value === '1') filters.country = []

  const params = paramsFromFilters(filters)
  const query = params.toString()
  return query ? `/matches?${query}` : '/matches'
}
