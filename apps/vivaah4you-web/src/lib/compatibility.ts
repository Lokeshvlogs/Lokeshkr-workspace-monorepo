import { labelFor } from '@/lib/profileDisplay'
import { isFilled } from '@/lib/profileCompletion'
import type { PublicProfile } from '@/types/profile'

/**
 * pass / fail   - stated, and the candidate does or does not meet it
 * no-preference - explicitly "any"
 * unanswered    - the preference was never filled in
 * unknown       - the candidate has not answered the field being tested
 */
export type PrefVerdict = 'pass' | 'fail' | 'no-preference' | 'unanswered' | 'unknown'

export interface PrefCheck {
  key: string
  label: string
  wanted: string
  actual: string
  verdict: PrefVerdict
}

export interface Compatibility {
  preferences: PrefCheck[]
  /** Preferences met. */
  met: number
  /** Preferences actually scorable - the denominator. */
  considered: number
  /** met/considered as a percentage, or null when nothing is scorable. */
  score: number | null
  /** Their preferences measured against me. */
  reverse: PrefCheck[]
  /** Of their preferences, how many I meet. */
  reverseMet: number
  reverseConsidered: number
  /** reverseMet/reverseConsidered as a percentage, or null when unscorable. */
  reverseScore: number | null
  /** Whether each side meets what the other asked for. */
  mutual: 'both' | 'you-only' | 'them-only' | 'neither' | 'unknown'
}

const totalInches = (profile: PublicProfile): number =>
  (profile.heightFeet || 0) * 12 + (profile.heightInches || 0)

/** "5 ft 9 in" from a total-inches figure - partner heights are stored that way. */
const inchesToHeight = (inches: number): string =>
  `${Math.floor(inches / 12)} ft ${inches % 12} in`

/**
 * The values a preference actually asks for.
 *
 * Accepts an array (the current shape) or a bare string (the singular columns,
 * still present for one release), so a profile saved either way is judged the
 * same. 'any' is not a requirement, so it drops out.
 */
function wantedValues(value: unknown): string[] {
  const list = Array.isArray(value) ? value : value ? [value] : []
  return list.map((v) => String(v).trim()).filter((v) => v && v !== 'any')
}

/**
 * Measure a candidate against one profile's stated partner preferences.
 *
 * `owner` is whose preferences are being applied, so the reverse direction is
 * the same call with the arguments swapped.
 */
export function checkPreferences(owner: PublicProfile, candidate: PublicProfile): PrefCheck[] {
  const checks: PrefCheck[] = []

  /**
   * A preference listing one or more acceptable values.
   *
   * Semantics are OR within a field and AND across fields: "Hindu or Jain" is
   * met by either, but a religion preference and a diet preference must both
   * be satisfied.
   */
  const oneOf = (
    key: string,
    label: string,
    wantedValue: unknown,
    actualValue: string,
    labelKey: string,
  ) => {
    const wanted = wantedValues(wantedValue)

    if (wanted.length === 0) {
      // With a list there is no way to tell "explicitly any" from "never
      // answered" - both are []. Reported as unanswered, which is the honest
      // reading when looking at someone else's preferences.
      checks.push({ key, label, wanted: '', actual: labelFor(labelKey, actualValue), verdict: 'unanswered' })
      return
    }

    const shown = wanted.map((v) => labelFor(labelKey, v)).join(' or ')

    if (!isFilled(actualValue)) {
      checks.push({ key, label, wanted: shown, actual: '', verdict: 'unknown' })
      return
    }

    checks.push({
      key,
      label,
      wanted: shown,
      actual: labelFor(labelKey, actualValue),
      verdict: wanted.includes(actualValue) ? 'pass' : 'fail',
    })
  }

  // --- Age range, in years ---
  const ageMin = owner.partnerAgeMin
  const ageMax = owner.partnerAgeMax
  const wantsAge = ageMin != null || ageMax != null
  const theirAge = candidate.age

  checks.push({
    key: 'partnerAge',
    label: 'Age',
    wanted: !wantsAge
      ? ''
      : ageMin != null && ageMax != null
        ? `${ageMin}-${ageMax} yrs`
        : ageMin != null
          ? `${ageMin}+ yrs`
          : `up to ${ageMax} yrs`,
    actual: theirAge ? `${theirAge} yrs` : '',
    verdict: !wantsAge
      ? 'unanswered'
      : !theirAge
        ? 'unknown'
        : theirAge >= (ageMin ?? 0) && theirAge <= (ageMax ?? Infinity)
          ? 'pass'
          : 'fail',
  })

  // --- Height range. Preferences are stored as TOTAL INCHES, while a profile's
  // own height is a feet/inches pair, so the candidate has to be converted
  // before the two can be compared at all. ---
  const heightMin = owner.partnerHeightMin
  const heightMax = owner.partnerHeightMax
  const wantsHeight = heightMin != null || heightMax != null
  const theirInches = totalInches(candidate)

  checks.push({
    key: 'partnerHeight',
    label: 'Height',
    wanted: !wantsHeight
      ? ''
      : heightMin != null && heightMax != null
        ? `${inchesToHeight(heightMin)} - ${inchesToHeight(heightMax)}`
        : heightMin != null
          ? `${inchesToHeight(heightMin)} and up`
          : `up to ${inchesToHeight(heightMax as number)}`,
    actual: theirInches ? inchesToHeight(theirInches) : '',
    verdict: !wantsHeight
      ? 'unanswered'
      : !theirInches
        ? 'unknown'
        : theirInches >= (heightMin ?? 0) && theirInches <= (heightMax ?? Infinity)
          ? 'pass'
          : 'fail',
  })

  // Each falls back to the singular column so a profile that has not been
  // re-saved since the multi-select release is still judged correctly.
  oneOf('partnerMaritalStatus', 'Marital status', owner.partnerMaritalStatuses ?? owner.partnerMaritalStatus, candidate.maritalStatus, 'maritalStatus')
  oneOf('partnerReligion', 'Religion', owner.partnerReligions ?? owner.partnerReligion, candidate.religion, 'religion')
  oneOf('partnerCommunity', 'Community', owner.partnerCommunities ?? owner.partnerCommunity, candidate.community, 'community')
  oneOf('partnerMotherTongue', 'Mother tongue', owner.partnerMotherTongues ?? owner.partnerMotherTongue, candidate.mothertongue, 'mothertongue')
  oneOf('partnerCountry', 'Country', owner.partnerCountries ?? owner.partnerCountry, candidate.currentCountry, 'currentCountry')
  oneOf('partnerEducation', 'Education', owner.partnerEducations ?? owner.partnerEducation, candidate.educationLevel, 'educationLevel')
  oneOf('partnerProfession', 'Profession', owner.partnerProfessions ?? owner.partnerProfession, candidate.profession, 'profession')
  oneOf('partnerDiet', 'Diet', owner.partnerDiets ?? owner.partnerDiet, candidate.diet, 'diet')

  // Lifestyle and outlook, each matched against the candidate's own answer.
  oneOf('partnerReligiosity', 'Religious outlook', owner.partnerReligiosities, candidate.religiosity, 'religiosity')
  oneOf('partnerSmoking', 'Smoking', owner.partnerSmoking, candidate.smoking, 'smoking')
  oneOf('partnerDrinking', 'Drinking', owner.partnerDrinking, candidate.drinking, 'drinking')

  // `partnerSettleAbroad` and `partnerRelocateAfterMarriage` are deliberately
  // NOT scored. The wizard stopped asking either (the After-marriage section
  // was replaced by the three checks above), so for anyone registering now
  // they would be a permanently 'unanswered' check. The stored values are
  // still shown on the profile; they just no longer move the percentage.

  return checks
}

const tally = (checks: PrefCheck[]) => ({
  met: checks.filter((c) => c.verdict === 'pass').length,
  considered: checks.filter((c) => c.verdict === 'pass' || c.verdict === 'fail').length,
})

/**
 * How a match lines up with me, both ways round.
 *
 * The score answers exactly one question - "does this person meet what I asked
 * for" - so only preferences that were actually stated AND that the candidate
 * has answered count towards it. 'no-preference', 'unanswered' and 'unknown'
 * are left out of the denominator rather than counted as passes: counting them
 * as passes would hand 100% to a member who has answered nothing, which is
 * worse than showing no number at all.
 *
 * Attribute similarity is deliberately not blended in, so the figure stays
 * explainable in a sentence: "meets 7 of the 9 things you asked for".
 */
export function compareProfiles(me: PublicProfile, them: PublicProfile): Compatibility {
  const preferences = checkPreferences(me, them)
  const reverse = checkPreferences(them, me)

  const mine = tally(preferences)
  const theirs = tally(reverse)

  const iAmSuited = mine.considered > 0 ? mine.met === mine.considered : null
  const theyAreSuited = theirs.considered > 0 ? theirs.met === theirs.considered : null

  let mutual: Compatibility['mutual'] = 'unknown'
  if (iAmSuited !== null && theyAreSuited !== null) {
    mutual = iAmSuited && theyAreSuited
      ? 'both'
      : iAmSuited
        ? 'you-only'
        : theyAreSuited
          ? 'them-only'
          : 'neither'
  }

  return {
    preferences,
    met: mine.met,
    considered: mine.considered,
    score: mine.considered === 0 ? null : Math.round((mine.met * 100) / mine.considered),
    reverse,
    reverseMet: theirs.met,
    reverseConsidered: theirs.considered,
    reverseScore:
      theirs.considered === 0 ? null : Math.round((theirs.met * 100) / theirs.considered),
    mutual,
  }
}
