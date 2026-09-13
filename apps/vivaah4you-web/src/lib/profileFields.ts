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
import { citiesForState, statesForCountry, citiesForCountry, communitiesFor, RELIGION_OPTIONS } from '@/lib/profileDisplay'
import { TAG_CATEGORIES } from '@/constants/selectOptions/interests'
import { iconFor } from '@/lib/profileIcons'
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
  /**
   * Rendered only on the owner's own profile.
   *
   * For a field a visitor has no business reading as a row because a hero tag
   * already says it, but which the owner still has to be able to edit - the
   * country/state pair feeding the city dropdown being the whole reason this
   * exists.
   */
  ownerOnly?: boolean
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

/**
 * The panels `ProfileDetails` draws, in order.
 *
 * Two titles have left, and where their fields went matters more than that
 * they are gone:
 *
 * - **Religion & Community** - `religion`, `community` and `mothertongue` are
 *   hero tags; `religiosity` and `religiosityDetail` moved to Lifestyle. There
 *   was nothing left to draw.
 * - **Family** - all six fields are promoted into the family graph, beneath the
 *   tree they describe.
 *
 * Both titles are removed rather than left to auto-filter as empty. Be aware of
 * what that trades away: a field given a section that is NOT in this list
 * renders nowhere, silently. `'Basic Details'` is the standing proof - it is
 * the section of nine defs and is absent from here, which is why
 * `bodyPhysique` and `manglikLevel` appear on no profile at all.
 *
 * Removal still wins for these two, because the alternative failure is worse:
 * leaving the titles here means a field added later quietly RESURRECTS a panel
 * that was deliberately taken away. Add the title back when a field genuinely
 * needs it.
 */
export const SECTIONS = [
  'Origins',
  'Education & Career',
  'Lifestyle',
  'Interests',
  'Partner Preference',
] as const

/**
 * Panels only the owner sees.
 *
 * Partner Preference is a member's own answers about who they are looking for.
 * A reader gets `CompatibilityPanel` instead, which scores them against those
 * same answers - printing the raw list above it said the same thing twice.
 *
 * A section-level rule rather than `ownerOnly` on all sixteen defs, because the
 * thing that is owner-only here is the panel, not each field independently.
 */
const OWNER_ONLY_SECTIONS: ReadonlySet<string> = new Set(['Partner Preference'])

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


  // ---- Origins (step 1) ----
  /* There is no Location panel any more: where someone lives is a tag on the
     hero, and repeating it as three rows was the duplication this removed.

     `currentCountry` and `currentState` stay as OWNER-ONLY rows rather than
     going with it. They are the inputs to `currentCity`'s option list, so
     without them a member who moves country could never fix their city outside
     the wizard - the dropdown would have nothing to build from.

     Country resets both the state and the city below it, and state resets the
     city: a Kerala city left standing under Sweden is worse than an empty
     field, because it looks answered. */
  { key: 'currentCountry', label: 'Country', section: 'Origins', step: 1, editor: 'select', searchable: true, ownerOnly: true, options: COUNTRY_OPTIONS, resets: ['currentState', 'currentCity'] },
  { key: 'currentState', label: 'State', section: 'Origins', step: 1, editor: 'select', searchable: true, ownerOnly: true, optionsFor: (p) => statesForCountry(p.currentCountry), resets: ['currentCity'] },
  { key: 'currentCity', label: 'Lives in', section: 'Origins', step: 1, editor: 'select', searchable: true, ownerOnly: true, optionsFor: (p) => citiesForState(p.currentCountry, p.currentState) },
  /* Birthplace is kept and moved rather than dropped with the panel: it is what
     a horoscope is read against, and losing it would be a regression dressed up
     as a simplification. */
  { key: 'placeOfBirthCountry', label: 'Birth country', section: 'Origins', step: 1, editor: 'select', searchable: true, options: COUNTRY_OPTIONS, resets: ['placeOfBirthState', 'placeOfBirthCity'] },
  { key: 'placeOfBirthState', label: 'Birth state', section: 'Origins', step: 1, editor: 'select', searchable: true, optionsFor: (p) => statesForCountry(p.placeOfBirthCountry), resets: ['placeOfBirthCity'] },
  { key: 'placeOfBirthCity', label: 'Born in', section: 'Origins', step: 1, editor: 'select', searchable: true, optionsFor: (p) => citiesForState(p.placeOfBirthCountry, p.placeOfBirthState) },
  /* Citizenship reads as a hero tag for a visitor; the owner still edits it
     here, since the tag is not an editor. */
  { key: 'citizenshipCountry', label: 'Citizen of', section: 'Origins', step: 1, editor: 'select', searchable: true, ownerOnly: true, options: COUNTRY_OPTIONS },

  /* ---- Education & Career (step 2) ----
     educationLevel / fieldOfStudy / collegeUniversity have NO rows in this
     section: they are a flattening of the education table, and
     EducationTimeline renders that table above these fields. Printing both
     would show the top qualification twice.

     `fieldOfStudy` and `collegeUniversity` have no def at all any more - the
     timeline reads `profile.educations` directly, and `labelFor` works off
     LABEL_MAPS rather than off this list. An earlier version of this comment
     claimed all three defs had survived; they had not.

     `educationLevel` DOES have one, just below. It is in HERO_TAG_KEYS, so
     PROMOTED_KEYS withholds it from this section and the hero is its only
     render site - and the hero resolves every key through this list, so
     without a def it would be dropped in silence. That is the same failure
     recorded against `age`, which for months appeared on no profile at all. */
  /* `readonly`: the wizard's education step recomputes this from the education
     rows, so an inline edit would be overwritten on its next save. Both render
     sites check the editor kind before offering a pencil. */
  { key: 'educationLevel', label: 'Highest education', section: 'Education & Career', step: 2, editor: 'readonly', options: educationOptions },
  // employerName mirrors the education fields: written through the wizard's
  // picker, which resolves it against the catalog, so no pencil here.
  { key: 'employerName', label: 'Employer', section: 'Education & Career', step: 2, editor: 'readonly' },
  { key: 'settleAbroad', label: 'Settling abroad', section: 'Education & Career', step: 2, editor: 'chips', options: YES_NO_MAYBE_OPTIONS },
  { key: 'profession', label: 'Profession', section: 'Education & Career', step: 2, editor: 'select', searchable: true, options: professionOptions },
  { key: 'employedIn', label: 'Employed in', section: 'Education & Career', step: 2, editor: 'select', options: employedInOptions },
  { key: 'employedAs', label: 'Employed as', section: 'Education & Career', step: 2, editor: 'select', searchable: true, options: employedAsOptions },
  /* profession and salaryAmount are HERO TAGS - see HERO_TAG_KEYS below. Their
     defs stay so the owner still gets an inline editor in the hero, and
     `fieldsBySection` filters them out of this panel so they cannot render
     twice. workCountry and visaStatus went entirely: both are folded into the
     residency tag. */
  { key: 'salaryAmount', label: 'Annual income', section: 'Education & Career', step: 2, editor: 'select', options: familyIncomeOptions },

  /* ---- Family (step 3) ----
     These no longer render as a panel of their own: FAMILY_FACT_KEYS promotes
     all six into the family graph, under the tree they describe.

     Country and state are `ownerOnly` for the same reason the Origins pair is:
     `familyLivingInCity` stores the composed "City, State, Country", so a
     reader needs only that one - but they are the inputs to the city
     dropdown's `optionsFor`, and without them the owner's picker has nothing
     to build from. */
  { key: 'familyLivingInCountry', label: 'Family country', section: 'Family', step: 3, editor: 'select', searchable: true, ownerOnly: true, options: COUNTRY_OPTIONS, resets: ['familyLivingInState', 'familyLivingInCity'] },
  { key: 'familyLivingInState', label: 'Family state', section: 'Family', step: 3, editor: 'select', searchable: true, ownerOnly: true, optionsFor: (p) => statesForCountry(p.familyLivingInCountry), resets: ['familyLivingInCity'] },
  { key: 'familyLivingInCity', label: 'Family lives in', section: 'Family', step: 3, editor: 'select', searchable: true, optionsFor: (p) => citiesForState(p.familyLivingInCountry, p.familyLivingInState) },
  { key: 'familyType', label: 'Family type', section: 'Family', step: 3, editor: 'chips', options: FAMILY_TYPE_OPTIONS },
  { key: 'familyIncome', label: 'Family income', section: 'Family', step: 3, editor: 'select', options: familyIncomeOptions },
  { key: 'livesWithFamily', label: 'Lives with family', section: 'Family', step: 3, editor: 'bool' },

  // ---- Lifestyle (step 3) ----
  { key: 'diet', label: 'Diet', section: 'Lifestyle', step: 4, editor: 'select', options: dietOptions },
  { key: 'smoking', label: 'Smoking', section: 'Lifestyle', step: 4, editor: 'select', options: smokingOptions },
  { key: 'drinking', label: 'Drinking', section: 'Lifestyle', step: 4, editor: 'select', options: drinkingOptions },
  { key: 'dailyRoutine', label: 'Rhythm', section: 'Lifestyle', step: 4, editor: 'chips', options: routineOptions },
  /* Religious outlook reads as a way of living rather than a fact about
     belief, so it sits with the daily habits rather than in a panel of its
     own - the last of what was "Religion & Community". `step` stays 1: these
     are still saved by the wizard's social-background step, and only the
     panel they render in has changed. */
  {
    key: 'religiosity',
    label: 'Religious outlook',
    section: 'Lifestyle',
    step: 1,
    editor: 'chips',
    options: RELIGIOSITY_OPTIONS,
    resets: ['religiosityDetail'],
  },
  {
    key: 'religiosityDetail',
    label: 'More specifically',
    section: 'Lifestyle',
    step: 1,
    editor: 'select',
    optionsFor: (profile) => religiosityDetailOptions(profile.religiosity),
  },

  // ---- Interests (step 4) ----
  /* Tag categories only. Music, films and reading hold named picks and are
     rendered by `ProfileMediaPicks` as artwork cards - a comma-joined <dd>
     saying "Tum Hi Ho, Sholay" would throw away the whole point of asking. */
  ...TAG_CATEGORIES.map((category) => ({
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

/**
 * The fields promoted out of their section and onto the hero as tags.
 *
 * ONE list drives two things: which tags the hero renders, and which fields
 * `fieldsBySection` withholds from the panels below. That is the point of it
 * being here rather than inside the hero component - a field promoted to a tag
 * cannot then also appear as a row, on either the public profile or the
 * owner's, because both read the same constant.
 */
export const HERO_TAG_KEYS = [
  'currentCity',
  'profession',
  'salaryAmount',
  'mothertongue',
  // Between mother tongue and community on purpose: a community list is scoped
  // to a religion, so the two read as a pair.
  'religion',
  'community',
  // Rendered as a line rather than a pill: "tag" here means "promoted to the
  // hero", not "wears a chip". See the hero's own partition.
  'educationLevel',
] as const

/** The family facts, promoted into the family graph beneath its tree. */
export const FAMILY_FACT_KEYS = [
  'familyLivingInCountry',
  'familyLivingInState',
  'familyLivingInCity',
  'familyType',
  'familyIncome',
  'livesWithFamily',
] as const

/**
 * Every field a dedicated panel has taken ownership of.
 *
 * One set, filtered in one place, so a promoted field cannot also appear as a
 * section row - on the public profile or the owner's. Adding a destination
 * means adding its key list here and nowhere else.
 */
const PROMOTED_KEYS: ReadonlySet<string> = new Set<string>([
  ...HERO_TAG_KEYS,
  ...FAMILY_FACT_KEYS,
])

const defsFor = (keys: readonly string[]): ProfileFieldDef[] =>
  keys
    .map((key) => PROFILE_FIELDS.find((f) => f.key === key))
    .filter((def): def is ProfileFieldDef => Boolean(def))

/** The defs behind the hero tags, in the order the tags are shown. */
export const heroTagFields = (): ProfileFieldDef[] => defsFor(HERO_TAG_KEYS)

/** The defs behind the family facts strip, in the order they are shown. */
export const familyFactFields = ({ owner = false }: { owner?: boolean } = {}) =>
  defsFor(FAMILY_FACT_KEYS).filter((def) => owner || !def.ownerOnly)

/**
 * Whether a row needs the whole width of its panel rather than half of it.
 *
 * Two clauses, and the second is the less obvious one:
 *
 * - A `textarea` or a `multiselect` has no ceiling on its length. `labelFor`
 *   comma-joins a multiselect, and `partnerCommunities` or `interestsCuisines`
 *   can run to hundreds of characters.
 * - A field with no icon still prints its LABEL, and `.field-row-labelled`
 *   spends 8.5rem of the row on that lane. Half a panel is about 11.7rem on a
 *   public profile, so a labelled row squeezed into one would leave roughly
 *   2.5rem for the value. Iconless is a reason a row CANNOT go half-width, not
 *   a sign it is already fine.
 *
 * Deliberately not a length test on the value: that would lay the same panel
 * out differently for two members, and the threshold would be invented. This
 * decides on what a field IS, which is reviewable.
 *
 * In practice the iconless clause adds exactly one field beyond the editor
 * test - `religiosityDetail` - since the only other two iconless fields in a
 * rendered section are already textareas.
 */
export function spansRow(def: ProfileFieldDef): boolean {
  return def.editor === 'textarea' || def.editor === 'multiselect' || !iconFor(def.key)
}

export function fieldsBySection(
  { owner = false }: { owner?: boolean } = {},
): { title: string; fields: ProfileFieldDef[] }[] {
  return SECTIONS.filter((title) => owner || !OWNER_ONLY_SECTIONS.has(title))
    .map((title) => ({
      title,
      fields: PROFILE_FIELDS.filter(
        (f) =>
          f.section === title &&
          !PROMOTED_KEYS.has(f.key) &&
          (owner || !f.ownerOnly),
      ),
    }))
    .filter((s) => s.fields.length > 0)
}
