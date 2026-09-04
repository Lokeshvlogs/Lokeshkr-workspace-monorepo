import { formatHeight, labelFor, locationLabel } from '@/lib/profileDisplay'
import { isFilled } from '@/lib/profileCompletion'
import type { PublicProfile } from '@/types/profile'

/** Two answered values that agree, disagree, or a pair we cannot judge. */
export type AttrVerdict = 'same' | 'differ' | 'unknown'

/**
 * pass / fail   - stated, and the candidate does or does not meet it
 * no-preference - explicitly "any"
 * unanswered    - the preference was never filled in
 * unknown       - the candidate has not answered the field being tested
 */
export type PrefVerdict = 'pass' | 'fail' | 'no-preference' | 'unanswered' | 'unknown'

export interface AttrComparison {
  key: string
  label: string
  mine: string
  theirs: string
  verdict: AttrVerdict
}

export interface PrefCheck {
  key: string
  label: string
  wanted: string
  actual: string
  verdict: PrefVerdict
}

export interface Compatibility {
  attributes: AttrComparison[]
  preferences: PrefCheck[]
  /** Preferences met. */
  met: number
  /** Preferences actually scorable - the denominator. */
  considered: number
  /** met/considered as a percentage, or null when nothing is scorable. */
  score: number | null
  /** Their preferences measured against me. */
  reverse: PrefCheck[]
  /** Whether each side meets what the other asked for. */
  mutual: 'both' | 'you-only' | 'them-only' | 'neither' | 'unknown'
}

const totalInches = (profile: PublicProfile): number =>
  (profile.heightFeet || 0) * 12 + (profile.heightInches || 0)

/** "5 ft 9 in" from a total-inches figure - partner heights are stored that way. */
const inchesToHeight = (inches: number): string =>
  `${Math.floor(inches / 12)} ft ${inches % 12} in`

/**
 * Compare one field across both profiles.
 *
 * An unanswered field on either side is 'unknown', never 'differ'. Marking a
 * blank as a mismatch would punish incomplete profiles for staying silent,
 * which is the same rule the match filters already follow.
 */
function attr(
  key: string,
  label: string,
  me: PublicProfile,
  them: PublicProfile,
  format: (p: PublicProfile) => string,
  same?: (a: PublicProfile, b: PublicProfile) => boolean,
): AttrComparison {
  const mine = format(me)
  const theirs = format(them)
  const known = isFilled(mine) && isFilled(theirs)

  return {
    key,
    label,
    mine,
    theirs,
    verdict: !known ? 'unknown' : (same ? same(me, them) : mine === theirs) ? 'same' : 'differ',
  }
}

/** Side by side of the facts both profiles state about themselves. */
export function compareAttributes(me: PublicProfile, them: PublicProfile): AttrComparison[] {
  return [
    attr('age', 'Age', me, them, (p) => (p.age ? `${p.age} yrs` : ''), (a, b) =>
      Math.abs((a.age ?? 0) - (b.age ?? 0)) <= 3),
    attr('height', 'Height', me, them, (p) => formatHeight(p.heightFeet, p.heightInches), (a, b) =>
      Math.abs(totalInches(a) - totalInches(b)) <= 2),
    attr('religion', 'Religion', me, them, (p) => labelFor('religion', p.religion)),
    attr('community', 'Community', me, them, (p) => labelFor('community', p.community)),
    attr('mothertongue', 'Mother tongue', me, them, (p) => labelFor('mothertongue', p.mothertongue)),
    attr('educationLevel', 'Education', me, them, (p) => labelFor('educationLevel', p.educationLevel)),
    attr('profession', 'Profession', me, them, (p) => labelFor('profession', p.profession)),
    attr('diet', 'Diet', me, them, (p) => labelFor('diet', p.diet)),
    attr('maritalStatus', 'Marital status', me, them, (p) => labelFor('maritalStatus', p.maritalStatus)),
    // Judged on country but shown as the fuller "city, state, country" line:
    // two people in the same country read as a match to a matrimonial reader
    // even when their cities differ.
    attr('currentCity', 'Location', me, them, (p) => locationLabel(p), (a, b) =>
      isFilled(a.currentCountry) && a.currentCountry === b.currentCountry),
  ]
}

/** A preference of 'any' or blank is not a requirement. */
const stated = (value: unknown): boolean => isFilled(value) && String(value) !== 'any'

/**
 * Measure a candidate against one profile's stated partner preferences.
 *
 * `owner` is whose preferences are being applied, so the reverse direction is
 * the same call with the arguments swapped.
 */
export function checkPreferences(owner: PublicProfile, candidate: PublicProfile): PrefCheck[] {
  const checks: PrefCheck[] = []

  /** Exact-match preference against a single candidate field. */
  const exact = (
    key: string,
    label: string,
    wantedValue: string,
    actualValue: string,
    labelKey: string,
  ) => {
    if (!stated(wantedValue)) {
      // 'any' was chosen deliberately; blank was never answered. Both are
      // excluded from the score, but they read differently to the member.
      checks.push({
        key,
        label,
        wanted: isFilled(wantedValue) ? 'No preference' : '',
        actual: labelFor(labelKey, actualValue),
        verdict: isFilled(wantedValue) ? 'no-preference' : 'unanswered',
      })
      return
    }

    if (!isFilled(actualValue)) {
      checks.push({ key, label, wanted: labelFor(labelKey, wantedValue), actual: '', verdict: 'unknown' })
      return
    }

    checks.push({
      key,
      label,
      wanted: labelFor(labelKey, wantedValue),
      actual: labelFor(labelKey, actualValue),
      verdict: wantedValue === actualValue ? 'pass' : 'fail',
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

  exact('partnerMaritalStatus', 'Marital status', owner.partnerMaritalStatus, candidate.maritalStatus, 'maritalStatus')
  exact('partnerReligion', 'Religion', owner.partnerReligion, candidate.religion, 'religion')
  exact('partnerCommunity', 'Community', owner.partnerCommunity, candidate.community, 'community')
  exact('partnerMotherTongue', 'Mother tongue', owner.partnerMotherTongue, candidate.mothertongue, 'mothertongue')
  exact('partnerCountry', 'Country', owner.partnerCountry, candidate.currentCountry, 'currentCountry')
  exact('partnerEducation', 'Education', owner.partnerEducation, candidate.educationLevel, 'educationLevel')
  exact('partnerProfession', 'Profession', owner.partnerProfession, candidate.profession, 'profession')
  exact('partnerDiet', 'Diet', owner.partnerDiet, candidate.diet, 'diet')

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
    attributes: compareAttributes(me, them),
    preferences,
    met: mine.met,
    considered: mine.considered,
    score: mine.considered === 0 ? null : Math.round((mine.met * 100) / mine.considered),
    reverse,
    mutual,
  }
}
