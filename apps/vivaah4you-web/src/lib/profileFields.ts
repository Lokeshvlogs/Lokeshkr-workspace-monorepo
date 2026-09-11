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
  feetOptions,
  inchOptions,
  physiqueOptions,
  routineOptions,
  smokingOptions,
} from '@/constants/selectOptions/person'
import { COUNTRY_OPTIONS } from '@/constants/selectOptions/places'
import { motherTongueOptions } from '@/constants/selectOptions/social'
import {
  PARENT_OCCUPATION_OPTIONS,
  RELIGIOSITY_OPTIONS,
  SIBLING_COUNT_OPTIONS,
  religiosityDetailOptions,
} from '@/constants/selectOptions/beliefs'
import {
  PARTNER_AGE_OPTIONS,
  PARTNER_COUNTRY_CHOICES,
  PARTNER_DIET_CHOICES,
  PARTNER_EDUCATION_CHOICES,
  PARTNER_HEIGHT_OPTIONS,
  PARTNER_MARITAL_CHOICES,
  PARTNER_MOTHER_TONGUE_CHOICES,
  PARTNER_PROFESSION_CHOICES,
  PARTNER_RELIGION_CHOICES,
  PARTNER_RELIGIOSITY_CHOICES,
  PARTNER_SMOKING_CHOICES,
  PARTNER_DRINKING_CHOICES,
} from '@/constants/selectOptions/partner'
import { citiesForCountry, communitiesFor, RELIGION_OPTIONS } from '@/lib/profileDisplay'
import { INTEREST_CATEGORIES } from '@/constants/selectOptions/interests'
import type { PublicProfile } from '@/types/profile'

/**
 * One description of every profile field, shared by the read-only view and the
 * inline editor on /profile/me.
 *
 * `step` matters: the API saves per wizard step, so editing a single field still
 * has to say which step owns it. Keeping that here means the editor and the
 * wizard cannot drift apart on which control a field uses.
 */
export type EditorKind =
  /** Shown, never editable here - a value derived from something else. */
  | 'readonly'
  | 'text'
  | 'select'
  | 'multiselect'
  | 'chips'
  | 'textarea'
  | 'bool'
  | 'height'
  | 'date'

export interface ProfileFieldDef {
  /** Key in the API payload. `height` writes two keys - see EditableField. */
  key: string
  label: string
  section: string
  /** Wizard step that owns this field, sent as `step` on save. */
  step: number
  editor: EditorKind
  options?: SelectOption[]
  /** Options that depend on another field's current value. */
  optionsFor?: (profile: PublicProfile) => SelectOption[]
  searchable?: boolean
  min?: number
  max?: number
  captions?: string[]
  /** Clears these keys when this field changes (country -> city). */
  resets?: string[]
}

const GENDER_OPTIONS: SelectOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const MARITAL_OPTIONS: SelectOption[] = [
  { value: 'never_married', label: 'Never Married' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'annulled', label: 'Annulled' },
  { value: 'awaiting_divorce', label: 'Awaiting Divorce' },
]

const MANGLIK_OPTIONS: SelectOption[] = [
  { value: '0', label: "I don't know" },
  { value: '1', label: 'No' },
  { value: '2', label: 'Anshik / Partial' },
  { value: '3', label: 'Yes' },
]

/** Mirrors the wizard's list; "" stays distinguishable from an explicit "no". */
const YES_NO_MAYBE_OPTIONS: SelectOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'open', label: 'Open to it' },
  { value: 'no', label: 'No' },
]

const FAMILY_TYPE_OPTIONS: SelectOption[] = [
  { value: '0', label: 'Nuclear' },
  { value: '1', label: 'Joint' },
  { value: '2', label: 'Extended' },
]

export const SECTIONS = [
  'Religion & Community',
  'Location',
  'Education & Career',
  'Family',
  'Lifestyle',
  'Interests',
  'Partner Preference',
] as const

/**
 * Communities across every religion a member is open to.
 *
 * Community values are namespaced per religion, so several religions means
 * several lists concatenated - de-duplicated, because a handful of values
 * appear under more than one.
 */
function communitiesForAny(religions: string[] | undefined): SelectOption[] {
  const seen = new Set<string>()
  return (religions ?? []).flatMap((religion) =>
    communitiesFor(religion).filter((option) =>
      seen.has(option.value) ? false : (seen.add(option.value), true),
    ),
  )
}

export const PROFILE_FIELDS: ProfileFieldDef[] = [
  // ---- About (step 0) ----

  // ---- Basic Details (step 0) ----
  { key: 'firstName', label: 'First name', section: 'Basic Details', step: 0, editor: 'text' },
  { key: 'surname', label: 'Surname', section: 'Basic Details', step: 0, editor: 'text' },
  // Derived from `dob` on the server, so it is shown and never edited. Without
  // a def here the hero silently dropped it - `HERO_FACT_KEYS` looked it up in
  // this list and got undefined, so age has never appeared on a profile.
  { key: 'age', label: 'Age', section: 'Basic Details', step: 0, editor: 'readonly' },
  { key: 'dob', label: 'Date of birth', section: 'Basic Details', step: 0, editor: 'date' },
  { key: 'gender', label: 'Gender', section: 'Basic Details', step: 0, editor: 'chips', options: GENDER_OPTIONS },
  { key: 'height', label: 'Height', section: 'Basic Details', step: 0, editor: 'height' },
  { key: 'bodyPhysique', label: 'Body type', section: 'Basic Details', step: 0, editor: 'chips', options: physiqueOptions },
  { key: 'maritalStatus', label: 'Marital status', section: 'Basic Details', step: 0, editor: 'chips', options: MARITAL_OPTIONS },
  { key: 'manglikLevel', label: 'Manglik', section: 'Basic Details', step: 0, editor: 'chips', options: MANGLIK_OPTIONS },

  // ---- Religion & Community (step 1) ----
  {
    key: 'religion',
    label: 'Religion',
    section: 'Religion & Community',
    step: 1,
    editor: 'select',
    options: RELIGION_OPTIONS,
    resets: ['community'],
  },
  {
    key: 'community',
    label: 'Community',
    section: 'Religion & Community',
    step: 1,
    editor: 'select',
    searchable: true,
    optionsFor: (profile) => communitiesFor(profile.religion),
  },
  {
    key: 'mothertongue',
    label: 'Mother tongue',
    section: 'Religion & Community',
    step: 1,
    editor: 'select',
    searchable: true,
    options: motherTongueOptions as SelectOption[],
  },

  {
    key: 'religiosity',
    label: 'Religious outlook',
    section: 'Religion & Community',
    step: 1,
    editor: 'chips',
    options: RELIGIOSITY_OPTIONS,
    resets: ['religiosityDetail'],
  },
  {
    key: 'religiosityDetail',
    label: 'More specifically',
    section: 'Religion & Community',
    step: 1,
    editor: 'select',
    optionsFor: (profile) => religiosityDetailOptions(profile.religiosity),
  },

  // ---- Location (step 1) ----
  { key: 'currentCountry', label: 'Country', section: 'Location', step: 1, editor: 'select', searchable: true, options: COUNTRY_OPTIONS, resets: ['currentCity'] },
  { key: 'currentCity', label: 'Lives in', section: 'Location', step: 1, editor: 'select', searchable: true, optionsFor: (p) => citiesForCountry(p.currentCountry) },
  { key: 'placeOfBirthCountry', label: 'Birth country', section: 'Location', step: 1, editor: 'select', searchable: true, options: COUNTRY_OPTIONS, resets: ['placeOfBirthCity'] },
  { key: 'placeOfBirthCity', label: 'Born in', section: 'Location', step: 1, editor: 'select', searchable: true, optionsFor: (p) => citiesForCountry(p.placeOfBirthCountry) },
  { key: 'citizenshipCountry', label: 'Citizen of', section: 'Location', step: 1, editor: 'select', searchable: true, options: COUNTRY_OPTIONS },

  // ---- Education & Career (step 2) ----
  // educationLevel / fieldOfStudy / collegeUniversity are DERIVED from the
  // education rows, so they are shown read-only here and edited in the wizard.
  // Offering a pencil on them would let an inline edit be silently overwritten
  // the next time the education step is saved.
  { key: 'educationLevel', label: 'Education', section: 'Education & Career', step: 2, editor: 'readonly', options: educationOptions },
  { key: 'fieldOfStudy', label: 'Field of study', section: 'Education & Career', step: 2, editor: 'readonly', options: fieldOfStudyOptions },
  { key: 'collegeUniversity', label: 'College', section: 'Education & Career', step: 2, editor: 'readonly' },
  // employerName mirrors the education fields: written through the wizard's
  // picker, which resolves it against the catalog, so no pencil here.
  { key: 'employerName', label: 'Employer', section: 'Education & Career', step: 2, editor: 'readonly' },
  { key: 'workCountry', label: 'Works in', section: 'Education & Career', step: 2, editor: 'select', searchable: true, options: COUNTRY_OPTIONS },
  { key: 'visaStatus', label: 'Residency status', section: 'Education & Career', step: 2, editor: 'readonly' },
  { key: 'settleAbroad', label: 'Settling abroad', section: 'Education & Career', step: 2, editor: 'chips', options: YES_NO_MAYBE_OPTIONS },
  { key: 'profession', label: 'Profession', section: 'Education & Career', step: 2, editor: 'select', searchable: true, options: professionOptions },
  { key: 'employedIn', label: 'Employed in', section: 'Education & Career', step: 2, editor: 'select', options: employedInOptions },
  { key: 'employedAs', label: 'Employed as', section: 'Education & Career', step: 2, editor: 'select', searchable: true, options: employedAsOptions },
  { key: 'salaryAmount', label: 'Annual income', section: 'Education & Career', step: 2, editor: 'select', options: familyIncomeOptions },

  // ---- Family (step 1) ----
  { key: 'familyLivingInCountry', label: 'Family country', section: 'Family', step: 3, editor: 'select', searchable: true, options: COUNTRY_OPTIONS, resets: ['familyLivingInCity'] },
  { key: 'familyLivingInCity', label: 'Family lives in', section: 'Family', step: 3, editor: 'select', searchable: true, optionsFor: (p) => citiesForCountry(p.familyLivingInCountry) },
  { key: 'familyType', label: 'Family type', section: 'Family', step: 3, editor: 'chips', options: FAMILY_TYPE_OPTIONS },
  { key: 'familyIncome', label: 'Family income', section: 'Family', step: 3, editor: 'select', options: familyIncomeOptions },
  { key: 'livesWithFamily', label: 'Lives with family', section: 'Family', step: 3, editor: 'bool' },

  // ---- Lifestyle (step 3) ----
  { key: 'diet', label: 'Diet', section: 'Lifestyle', step: 4, editor: 'select', options: dietOptions },
  { key: 'smoking', label: 'Smoking', section: 'Lifestyle', step: 4, editor: 'select', options: smokingOptions },
  { key: 'drinking', label: 'Drinking', section: 'Lifestyle', step: 4, editor: 'select', options: drinkingOptions },
  { key: 'dailyRoutine', label: 'Rhythm', section: 'Lifestyle', step: 4, editor: 'chips', options: routineOptions },

  // ---- Interests (step 4) ----
  ...INTEREST_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    section: 'Interests',
    step: 4,
    editor: 'multiselect' as EditorKind,
    searchable: true,
    options: category.options as SelectOption[],
  })),
  { key: 'interestsOther', label: 'More about me', section: 'Interests', step: 4, editor: 'textarea' },

  // ---- Partner preference (step 5, all optional) ----
  { key: 'partnerAgeMin', label: 'Age from', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_AGE_OPTIONS },
  { key: 'partnerAgeMax', label: 'Age to', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_AGE_OPTIONS },
  { key: 'partnerHeightMin', label: 'Height from', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_HEIGHT_OPTIONS },
  { key: 'partnerHeightMax', label: 'Height to', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_HEIGHT_OPTIONS },
  // Multi-value from here on; these mirror the wizard's step 5 exactly. The
  // singular partnerXxx keys still exist on the payload for one release but are
  // no longer edited anywhere, so nothing can write the two out of agreement.
  { key: 'partnerMaritalStatuses', label: 'Marital status', section: 'Partner Preference', step: 5, editor: 'multiselect', options: PARTNER_MARITAL_CHOICES },
  { key: 'partnerReligions', label: 'Religion', section: 'Partner Preference', step: 5, editor: 'multiselect', options: PARTNER_RELIGION_CHOICES, resets: ['partnerCommunities'] },
  { key: 'partnerCommunities', label: 'Community', section: 'Partner Preference', step: 5, editor: 'multiselect', searchable: true, optionsFor: (p) => communitiesForAny(p.partnerReligions) },
  { key: 'partnerMotherTongues', label: 'Mother tongue', section: 'Partner Preference', step: 5, editor: 'multiselect', searchable: true, options: PARTNER_MOTHER_TONGUE_CHOICES },
  { key: 'partnerCountries', label: 'Country', section: 'Partner Preference', step: 5, editor: 'multiselect', searchable: true, options: PARTNER_COUNTRY_CHOICES },
  { key: 'partnerEducations', label: 'Education', section: 'Partner Preference', step: 5, editor: 'multiselect', searchable: true, options: PARTNER_EDUCATION_CHOICES },
  { key: 'partnerProfessions', label: 'Profession', section: 'Partner Preference', step: 5, editor: 'multiselect', searchable: true, options: PARTNER_PROFESSION_CHOICES },
  { key: 'partnerDiets', label: 'Diet', section: 'Partner Preference', step: 5, editor: 'multiselect', options: PARTNER_DIET_CHOICES },
  { key: 'partnerReligiosities', label: 'Religious outlook', section: 'Partner Preference', step: 5, editor: 'multiselect', options: PARTNER_RELIGIOSITY_CHOICES },
  { key: 'partnerSmoking', label: 'Smoking', section: 'Partner Preference', step: 5, editor: 'multiselect', options: PARTNER_SMOKING_CHOICES },
  { key: 'partnerDrinking', label: 'Drinking', section: 'Partner Preference', step: 5, editor: 'multiselect', options: PARTNER_DRINKING_CHOICES },
  { key: 'partnerAbout', label: 'Looking for', section: 'Partner Preference', step: 5, editor: 'textarea' },
]

export const HEIGHT_FEET_OPTIONS = feetOptions
export const HEIGHT_INCH_OPTIONS = inchOptions

export function optionsForField(def: ProfileFieldDef, profile: PublicProfile): SelectOption[] {
  if (def.optionsFor) return def.optionsFor(profile)
  return def.options ?? []
}

export function fieldsBySection(): { title: string; fields: ProfileFieldDef[] }[] {
  return SECTIONS.map((title) => ({
    title,
    fields: PROFILE_FIELDS.filter((f) => f.section === title),
  })).filter((s) => s.fields.length > 0)
}
