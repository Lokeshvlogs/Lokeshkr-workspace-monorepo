import type { SelectOption } from '@lokesh-workspace/ui'

import {
  collegeOptions,
  educationOptions,
  employedAsOptions,
  employedInOptions,
  fieldOfStudyOptions,
  professionOptions,
} from '@/constants/selectOptions/career'
import { ALL_EMPLOYED_AS } from '@/constants/selectOptions/employedAs'
import { TAG_CATEGORIES } from '@/constants/selectOptions/interests'
import { familyIncomeOptions } from '@/constants/selectOptions/people'
import {
  dietOptions,
  drinkingOptions,
  physiqueOptions,
  smokingOptions,
} from '@/constants/selectOptions/person'
import { COUNTRY_OPTIONS, placesByCountry } from '@/constants/selectOptions/places'
import { communitiesByReligion, motherTongueOptions } from '@/constants/selectOptions/social'
import {
  PARENT_OCCUPATION_OPTIONS,
  RELIGIOSITY_OPTIONS,
  religiosityDetailOptions,
} from '@/constants/selectOptions/beliefs'
import type { PublicProfile } from '@/types/profile'

/** The DB stores option values; these turn them back into display labels. */
const toLabelMap = (options: SelectOption[]) =>
  options.reduce<Record<string, string>>((acc, o) => {
    acc[o.value] = o.label
    return acc
  }, {})

const MARITAL_STATUS_LABELS_RAW: Record<string, string> = {
  never_married: 'Never Married',
  married: 'Married',
  divorced: 'Divorced',
  widowed: 'Widowed',
  annulled: 'Annulled',
  awaiting_divorce: 'Awaiting Divorce',
}

const LABEL_MAPS: Record<string, Record<string, string>> = {
  bodyPhysique: toLabelMap(physiqueOptions),
  diet: toLabelMap(dietOptions),
  smoking: toLabelMap(smokingOptions),
  drinking: toLabelMap(drinkingOptions),
  educationLevel: toLabelMap(educationOptions),
  fieldOfStudy: toLabelMap(fieldOfStudyOptions),
  collegeUniversity: toLabelMap(collegeOptions),
  profession: toLabelMap(professionOptions),
  employedIn: toLabelMap(employedInOptions),
  // Every ladder's labels as well as the generic list: a value saved from a
  // profession-specific ladder must still resolve, or the profile falls back to
  // titleCasing the slug.
  employedAs: { ...toLabelMap(employedAsOptions), ...toLabelMap(ALL_EMPLOYED_AS) },
  salaryAmount: toLabelMap(familyIncomeOptions),
  familyIncome: toLabelMap(familyIncomeOptions),
  currentCountry: toLabelMap(COUNTRY_OPTIONS),
  placeOfBirthCountry: toLabelMap(COUNTRY_OPTIONS),
  citizenshipCountry: toLabelMap(COUNTRY_OPTIONS),
  familyLivingInCountry: toLabelMap(COUNTRY_OPTIONS),
  mothertongue: toLabelMap(motherTongueOptions as SelectOption[]),
  religiosity: toLabelMap(RELIGIOSITY_OPTIONS),
  fatherOccupation: toLabelMap(PARENT_OCCUPATION_OPTIONS),
  motherOccupation: toLabelMap(PARENT_OCCUPATION_OPTIONS),
  partnerMaritalStatus: { any: 'No preference', ...MARITAL_STATUS_LABELS_RAW },
  partnerCountry: { any: 'No preference', ...toLabelMap(COUNTRY_OPTIONS) },
  partnerMotherTongue: { any: 'No preference', ...toLabelMap(motherTongueOptions as SelectOption[]) },
  partnerEducation: { any: 'No preference', ...toLabelMap(educationOptions) },
  partnerProfession: { any: 'No preference', ...toLabelMap(professionOptions) },
  partnerDiet: { any: 'No preference', ...toLabelMap(dietOptions) },
  settleAbroad: { yes: 'Yes', open: 'Open to it', no: 'No' },
  // The lifestyle preferences share the candidate's own vocabularies, so they
  // share the label maps too - `spiritual_not_religious` must not reach
  // titleCase and come out as "Spiritual Not Religious".
  /* The interest tags had no entry here at all, so every value fell through to
     `titleCase` on its slug: `lo_fi` rendered as "Lo Fi" and
     `not_much_reading` as "Not Much Reading". Built from the categories
     themselves so a new tag cannot be added without its label. */
  ...Object.fromEntries(
    TAG_CATEGORIES.map((category) => [category.key, toLabelMap(category.options as SelectOption[])]),
  ),
  partnerReligiosities: toLabelMap(RELIGIOSITY_OPTIONS),
  partnerSmoking: toLabelMap(smokingOptions),
  partnerDrinking: toLabelMap(drinkingOptions),
  partnerSettleAbroad: { yes: 'Yes', open: 'Open to discussion', no: 'No' },
  partnerRelocateAfterMarriage: { yes: 'Yes', open: 'Open to discussion', no: 'No' },
}

export const MARITAL_STATUS_LABELS = MARITAL_STATUS_LABELS_RAW

export const MANGLIK_LABELS = ["Don't know", 'No', 'Anshik / Partial', 'Yes']

// Order matches Profile.FAMILY_TYPE_CHOICES in the Django model.
export const FAMILY_TYPE_LABELS = ['Nuclear', 'Joint', 'Extended']

export const RELIGION_OPTIONS: SelectOption[] = [
  { value: 'hindu', label: 'Hindu' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'sikh', label: 'Sikh' },
  { value: 'christian', label: 'Christian' },
  { value: 'jain', label: 'Jain' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'parsi', label: 'Parsi' },
  { value: 'jewish', label: 'Jewish' },
  { value: 'other', label: 'Other' },
]

const RELIGION_LABELS = toLabelMap(RELIGION_OPTIONS)

/** Best-effort prettifier for values with no option list (free-text cities). */
const titleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())

/** Detail labels are namespaced per stance, so search each list. */
export function religiosityDetailLabel(value: string): string {
  for (const primary of RELIGIOSITY_OPTIONS) {
    const hit = religiosityDetailOptions(primary.value).find((o) => o.value === value)
    if (hit) return hit.label
  }
  return ''
}

/**
 * value -> label across every religion's community list, built once.
 *
 * The values are namespaced per religion, so resolving one used to mean a
 * linear scan of all of them - about 1,600 entries, repeated for every row on
 * screen. Later religions win a duplicate value, which matches the previous
 * first-hit-wins behaviour closely enough that no label changes in practice.
 */
const COMMUNITY_LABELS: Record<string, string> = Object.values(communitiesByReligion)
  .flat()
  .reduce<Record<string, string>>((acc, option) => {
    if (!(option.value in acc)) acc[option.value] = option.label
    return acc
  }, {})

export function labelFor(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return ''

  // Multi-value fields (partner preferences, interests) hold arrays. Without
  // this branch String(['hindu','jain']) is "hindu,jain", which titleCase then
  // renders as "Hindu,jain" - each value has to be resolved on its own.
  if (Array.isArray(value)) {
    return value
      .map((entry) => labelFor(field, entry))
      .filter(Boolean)
      .join(', ')
  }

  const raw = String(value)

  if (field === 'maritalStatus') return MARITAL_STATUS_LABELS[raw] ?? titleCase(raw)
  if (field === 'religiosityDetail') return religiosityDetailLabel(raw) || titleCase(raw)
  if (field === 'partnerReligion' || field === 'partnerCommunity') {
    if (raw === 'any') return 'No preference'
    return labelFor(field === 'partnerReligion' ? 'religion' : 'community', raw)
  }
  if (field === 'religion') return RELIGION_LABELS[raw] ?? titleCase(raw)
  if (field === 'community') return COMMUNITY_LABELS[raw] ?? titleCase(raw)

  const map = LABEL_MAPS[field]
  if (map && map[raw]) return map[raw]
  return titleCase(raw)
}

export function formatHeight(feet?: number | null, inches?: number | null): string {
  if (!feet) return ''
  return `${feet} ft ${inches ?? 0} in`
}

export function fullName(profile: Pick<PublicProfile, 'firstName' | 'surname'>): string {
  return [profile.firstName, profile.surname].filter(Boolean).join(' ').trim()
}

export function locationLabel(profile: Pick<PublicProfile, 'currentCity' | 'currentCountry'>): string {
  // currentCity is already stored as "City, State, Country".
  if (profile.currentCity) return profile.currentCity
  return labelFor('currentCountry', profile.currentCountry)
}

/** Communities for a religion, falling back to a single "Other" entry. */
export function communitiesFor(religion: string): SelectOption[] {
  return communitiesByReligion[religion] ?? [{ value: 'other', label: 'Other' }]
}

/** Built city lists, keyed by country code ('' is the global list). */
const CITY_CACHE = new Map<string, SelectOption[]>()

/** "City, State, Country" options for one country, or every city when unset. */
export function citiesForCountry(country: string): SelectOption[] {
  // Rebuilding was cheap per country but ruinous with none - it flattened and
  // deduped every city on earth - and this is called inline from JSX, so it ran
  // on every render. The source lists are static imports, so caching is safe.
  const cached = CITY_CACHE.get(country)
  if (cached) return cached

  const build = (countryKey: string) => {
    const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === countryKey)?.label ?? ''
    return (placesByCountry[countryKey] ?? []).flatMap((state) =>
      state.cities.map((city) => {
        const label = `${city.label}, ${state.label}${countryLabel ? `, ${countryLabel}` : ''}`
        return { value: label, label }
      }),
    )
  }

  let options: SelectOption[]
  if (country) {
    options = build(country)
  } else {
    const all = Object.keys(placesByCountry).flatMap(build)
    const seen = new Set<string>()
    options = all.filter((o) => (seen.has(o.label) ? false : seen.add(o.label)))
  }

  CITY_CACHE.set(country, options)
  return options
}
