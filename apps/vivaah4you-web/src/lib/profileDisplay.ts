import type { SelectOption } from '@lokesh-workspace/ui'

import {
  collegeOptions,
  educationOptions,
  employedAsOptions,
  employedInOptions,
  fieldOfStudyOptions,
  professionOptions,
} from '@/constants/selectOptions/career'
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
  employedAs: toLabelMap(employedAsOptions),
  salaryAmount: toLabelMap(familyIncomeOptions),
  familyIncome: toLabelMap(familyIncomeOptions),
  currentCountry: toLabelMap(COUNTRY_OPTIONS),
  placeOfBirthCountry: toLabelMap(COUNTRY_OPTIONS),
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

export function labelFor(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  const raw = String(value)

  if (field === 'maritalStatus') return MARITAL_STATUS_LABELS[raw] ?? titleCase(raw)
  if (field === 'religiosityDetail') return religiosityDetailLabel(raw) || titleCase(raw)
  if (field === 'partnerReligion' || field === 'partnerCommunity') {
    if (raw === 'any') return 'No preference'
    return labelFor(field === 'partnerReligion' ? 'religion' : 'community', raw)
  }
  if (field === 'religion') return RELIGION_LABELS[raw] ?? titleCase(raw)
  if (field === 'community') {
    // Community values are namespaced per religion, so search every list.
    for (const list of Object.values(communitiesByReligion)) {
      const hit = list.find((o) => o.value === raw)
      if (hit) return hit.label
    }
    return titleCase(raw)
  }

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

/** "City, State, Country" options for one country, or every city when unset. */
export function citiesForCountry(country: string): SelectOption[] {
  const build = (countryKey: string) => {
    const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === countryKey)?.label ?? ''
    return (placesByCountry[countryKey] ?? []).flatMap((state) =>
      state.cities.map((city) => {
        const label = `${city.label}, ${state.label}${countryLabel ? `, ${countryLabel}` : ''}`
        return { value: label, label }
      }),
    )
  }

  if (country) return build(country)

  const all = Object.keys(placesByCountry).flatMap(build)
  const seen = new Set<string>()
  return all.filter((o) => (seen.has(o.label) ? false : seen.add(o.label)))
}
