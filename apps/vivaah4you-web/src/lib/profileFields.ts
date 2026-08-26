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
  ANY_OPTION,
  PARTNER_AGE_OPTIONS,
  PARTNER_COUNTRY_OPTIONS,
  PARTNER_DIET_OPTIONS,
  PARTNER_EDUCATION_OPTIONS,
  PARTNER_HEIGHT_OPTIONS,
  PARTNER_MARITAL_OPTIONS,
  PARTNER_MOTHER_TONGUE_OPTIONS,
  PARTNER_PROFESSION_OPTIONS,
  PARTNER_RELIGION_OPTIONS,
} from '@/constants/selectOptions/partner'
import { citiesForCountry, communitiesFor, RELIGION_OPTIONS } from '@/lib/profileDisplay'
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
  | 'text'
  | 'select'
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

const FAMILY_TYPE_OPTIONS: SelectOption[] = [
  { value: '0', label: 'Nuclear' },
  { value: '1', label: 'Joint' },
  { value: '2', label: 'Extended' },
]

export const SECTIONS = [
  'About',
  'Basic Details',
  'Religion & Community',
  'Location',
  'Education & Career',
  'Family',
  'Lifestyle',
  'Partner Preference',
] as const

export const PROFILE_FIELDS: ProfileFieldDef[] = [
  // ---- About (step 0) ----
  { key: 'aboutMe', label: 'About me', section: 'About', step: 0, editor: 'textarea' },

  // ---- Basic Details (step 0) ----
  { key: 'firstName', label: 'First name', section: 'Basic Details', step: 0, editor: 'text' },
  { key: 'surname', label: 'Surname', section: 'Basic Details', step: 0, editor: 'text' },
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

  // ---- Education & Career (step 2) ----
  { key: 'educationLevel', label: 'Education', section: 'Education & Career', step: 2, editor: 'select', searchable: true, options: educationOptions },
  { key: 'fieldOfStudy', label: 'Field of study', section: 'Education & Career', step: 2, editor: 'select', searchable: true, options: fieldOfStudyOptions },
  { key: 'collegeUniversity', label: 'College', section: 'Education & Career', step: 2, editor: 'select', searchable: true, options: collegeOptions },
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

  // ---- Partner preference (step 5, all optional) ----
  { key: 'partnerAgeMin', label: 'Age from', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_AGE_OPTIONS },
  { key: 'partnerAgeMax', label: 'Age to', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_AGE_OPTIONS },
  { key: 'partnerHeightMin', label: 'Height from', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_HEIGHT_OPTIONS },
  { key: 'partnerHeightMax', label: 'Height to', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_HEIGHT_OPTIONS },
  { key: 'partnerMaritalStatus', label: 'Marital status', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_MARITAL_OPTIONS },
  { key: 'partnerReligion', label: 'Religion', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_RELIGION_OPTIONS, resets: ['partnerCommunity'] },
  { key: 'partnerCommunity', label: 'Community', section: 'Partner Preference', step: 5, editor: 'select', searchable: true, optionsFor: (p) => [ANY_OPTION, ...communitiesFor(p.partnerReligion)] },
  { key: 'partnerMotherTongue', label: 'Mother tongue', section: 'Partner Preference', step: 5, editor: 'select', searchable: true, options: PARTNER_MOTHER_TONGUE_OPTIONS },
  { key: 'partnerCountry', label: 'Country', section: 'Partner Preference', step: 5, editor: 'select', searchable: true, options: PARTNER_COUNTRY_OPTIONS },
  { key: 'partnerEducation', label: 'Education', section: 'Partner Preference', step: 5, editor: 'select', searchable: true, options: PARTNER_EDUCATION_OPTIONS },
  { key: 'partnerProfession', label: 'Profession', section: 'Partner Preference', step: 5, editor: 'select', searchable: true, options: PARTNER_PROFESSION_OPTIONS },
  { key: 'partnerDiet', label: 'Diet', section: 'Partner Preference', step: 5, editor: 'select', options: PARTNER_DIET_OPTIONS },
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
