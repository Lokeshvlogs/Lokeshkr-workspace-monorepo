import type { SelectOption } from '@lokesh-workspace/ui'

import { educationOptions, professionOptions } from '@/constants/selectOptions/career'
import { dietOptions } from '@/constants/selectOptions/person'
import { COUNTRY_OPTIONS } from '@/constants/selectOptions/places'
import { motherTongueOptions } from '@/constants/selectOptions/social'
import { RELIGION_OPTIONS } from '@/lib/profileDisplay'

/**
 * Partner preferences are all "no strong preference" by default - a blank
 * answer is meaningful here, so every list leads with an explicit `any`.
 */
export const ANY_OPTION: SelectOption = { value: 'any', label: 'No preference' }

const withAny = (options: SelectOption[]): SelectOption[] => [ANY_OPTION, ...options]

export const PARTNER_AGE_OPTIONS: SelectOption[] = Array.from({ length: 48 }, (_, i) => {
  const age = 18 + i
  return { value: String(age), label: `${age} yrs` }
})

/** Heights stored as total inches so a range is a single integer comparison. */
export const PARTNER_HEIGHT_OPTIONS: SelectOption[] = Array.from({ length: 37 }, (_, i) => {
  const inches = 48 + i // 4ft 0in .. 7ft 0in
  return { value: String(inches), label: `${Math.floor(inches / 12)} ft ${inches % 12} in` }
})

export const PARTNER_MARITAL_OPTIONS: SelectOption[] = withAny([
  { value: 'never_married', label: 'Never Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'awaiting_divorce', label: 'Awaiting Divorce' },
  { value: 'annulled', label: 'Annulled' },
])

export const PARTNER_RELIGION_OPTIONS = withAny(RELIGION_OPTIONS)
export const PARTNER_MOTHER_TONGUE_OPTIONS = withAny(motherTongueOptions as SelectOption[])
export const PARTNER_COUNTRY_OPTIONS = withAny(COUNTRY_OPTIONS)
export const PARTNER_EDUCATION_OPTIONS = withAny(educationOptions)
export const PARTNER_PROFESSION_OPTIONS = withAny(professionOptions)
export const PARTNER_DIET_OPTIONS = withAny(dietOptions)

/**
 * The same lists without the `any` row, for the multi-select preference
 * fields.
 *
 * Separate exports rather than stripping `any` at the call site, because the
 * lists above are still used single-select by the match search bar, where
 * "No preference" is a real row the reader picks. In a multi-select, choosing
 * nothing already says it - so `any` is offered as the MultiSelect's
 * `exclusiveValue` (which clears the selection) rather than as an option that
 * could sit alongside three real ones.
 */
export const PARTNER_MARITAL_CHOICES: SelectOption[] = PARTNER_MARITAL_OPTIONS.slice(1)
export const PARTNER_RELIGION_CHOICES: SelectOption[] = RELIGION_OPTIONS
export const PARTNER_MOTHER_TONGUE_CHOICES = motherTongueOptions as SelectOption[]
export const PARTNER_COUNTRY_CHOICES: SelectOption[] = COUNTRY_OPTIONS
export const PARTNER_EDUCATION_CHOICES: SelectOption[] = educationOptions
export const PARTNER_PROFESSION_CHOICES: SelectOption[] = professionOptions
export const PARTNER_DIET_CHOICES: SelectOption[] = dietOptions

/** Age and height bounds, shared by the wizard sliders and the search filters. */
export const PARTNER_AGE_MIN = 18
export const PARTNER_AGE_MAX = 65
/** Total inches, matching how partner heights are stored. */
export const PARTNER_HEIGHT_MIN_INCHES = 48
export const PARTNER_HEIGHT_MAX_INCHES = 84

export { withAny }
