import type { MyProfile } from '@/types/profile'

/**
 * Which wizard step owns each field counted towards `profile_completeness`.
 *
 * This mirrors `Profile.COMPLETENESS_TEXT_FIELDS` + `COMPLETENESS_POSITIVE_FIELDS`
 * plus the four extras (dob_time, age, gender, display_picture) scored in
 * `compute_completeness()` - see services/vivaah4u-api/apps/profiles/models.py.
 * Keys are the camelCase names the API returns, not the model's column names
 * (annual_income -> salaryAmount, mother_tongue -> mothertongue,
 * smoking_habits -> smoking, drinking_habits -> drinking,
 * display_picture -> photo, dob_time -> dob).
 *
 * EDIT THIS TOGETHER WITH models.py. If the two lists drift, a member can sit
 * at 97% with a "Complete profile" button that opens a step where every field
 * is already answered - or reach 100% with the button still showing.
 *
 * Step 5 (partner preference) is deliberately absent: the server scores none of
 * it, so it can never be what is keeping a profile below 100%.
 */
const COMPLETENESS_FIELDS: { key: keyof MyProfile; step: number }[] = [
  // Step 0 - Basic details
  { key: 'firstName', step: 0 },
  { key: 'surname', step: 0 },
  { key: 'dob', step: 0 },
  { key: 'age', step: 0 },
  { key: 'gender', step: 0 },
  { key: 'heightFeet', step: 0 },
  { key: 'bodyPhysique', step: 0 },

  // Step 1 - Social background
  { key: 'religion', step: 1 },
  { key: 'community', step: 1 },
  { key: 'mothertongue', step: 1 },
  { key: 'religiosity', step: 1 },
  { key: 'currentCountry', step: 1 },
  { key: 'currentCity', step: 1 },
  { key: 'placeOfBirthCountry', step: 1 },
  { key: 'placeOfBirthCity', step: 1 },

  // Step 2 - Education & career
  { key: 'educationLevel', step: 2 },
  { key: 'fieldOfStudy', step: 2 },
  { key: 'collegeUniversity', step: 2 },
  { key: 'profession', step: 2 },
  { key: 'employedIn', step: 2 },
  { key: 'employedAs', step: 2 },
  { key: 'salaryAmount', step: 2 },

  // Step 3 - Family background
  { key: 'familyLivingInCountry', step: 3 },
  { key: 'familyLivingInCity', step: 3 },
  { key: 'familyIncome', step: 3 },

  // Step 4 - Lifestyle
  { key: 'diet', step: 4 },
  { key: 'smoking', step: 4 },
  { key: 'drinking', step: 4 },

  // Step 6 - Photos
  { key: 'photo', step: 6 },
]

/**
 * Does this value count as answered?
 *
 * Mirrors the server: a blank string is unanswered, and 0 means "not set" for
 * the numeric fields scored here (nobody is 0 feet tall or 0 years old).
 */
export const isFilled = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return value > 0
  return String(value).trim() !== ''
}

/** Every scored field the member has not answered yet, in wizard order. */
export function missingFields(profile: MyProfile | null): { key: string; step: number }[] {
  if (!profile) return []
  return COMPLETENESS_FIELDS.filter((field) => !isFilled(profile[field.key])).map((field) => ({
    key: field.key as string,
    step: field.step,
  }))
}

/**
 * The lowest-numbered wizard step that still has a gap, or null when the
 * profile is fully answered. This is where "Complete profile" should land.
 */
export function firstIncompleteStep(profile: MyProfile | null): number | null {
  const missing = missingFields(profile)
  if (missing.length === 0) return null
  return Math.min(...missing.map((field) => field.step))
}
