/**
 * Forcing untrusted values into the shape the registration form expects.
 *
 * The wizard fills itself from two sources that are untrusted in the same way:
 *
 *  - `/api/profile/me`, whose types drift from the form's. Numbers and nulls
 *    arrive where a controlled input wants a string, and React warns (or worse)
 *    when a value goes null.
 *  - a localStorage draft, which can be arbitrarily old. One saved before a
 *    field became multi-select still holds the string it had then, and handing
 *    that to a control expecting an array threw and took down the whole step.
 *
 * Anything that cannot be salvaged returns `undefined`, which both callers read
 * as "not present" so the other source wins.
 */

/** The three interest categories that hold picks rather than slugs. */
const MEDIA_PICK_KEYS = new Set(['interestsMusic', 'interestsMovies', 'interestsBooks'])

/** A form-shaped education row: every bound input is a string. */
export interface EducationFormEntry {
  level: string
  fieldOfStudy: string
  country: string
  institutionSlug: string
  institutionName: string
  isOther: boolean
  reputationClaimed: boolean
  completionYear: string
}

export interface MediaPickFormEntry {
  title: string
  subtitle: string
  url: string
  provider: string
  thumbnail: string
}

export interface AchievementFormEntry {
  title: string
  year: string
  detail: string
}

export const toEducationEntry = (raw: any): EducationFormEntry => ({
  level: String(raw?.level ?? ''),
  fieldOfStudy: String(raw?.fieldOfStudy ?? ''),
  country: String(raw?.country ?? ''),
  institutionSlug: String(raw?.institutionSlug ?? ''),
  institutionName: String(raw?.institutionName ?? ''),
  isOther: Boolean(raw?.isOther),
  reputationClaimed: Boolean(raw?.reputationClaimed),
  // The API sends a number or null. A null bound to an input makes React warn
  // that a controlled component went uncontrolled.
  completionYear: raw?.completionYear == null ? '' : String(raw.completionYear),
})

/**
 * A media pick, from the API or from a draft.
 *
 * Every field is a string, including the ones the server may send as null, so a
 * controlled input never goes uncontrolled.
 */
export const toMediaPick = (raw: any): MediaPickFormEntry => ({
  title: String(raw?.title ?? ''),
  subtitle: String(raw?.subtitle ?? ''),
  url: String(raw?.url ?? ''),
  provider: String(raw?.provider ?? ''),
  thumbnail: String(raw?.thumbnail ?? ''),
})

export const toAchievementEntry = (raw: any): AchievementFormEntry => ({
  title: String(raw?.title ?? ''),
  year: raw?.year == null ? '' : String(raw.year),
  detail: String(raw?.detail ?? ''),
})

/**
 * Coerce one incoming value against the form's own initial value for that key,
 * which is the only reliable description of the shape a control expects.
 */
export function coerceToFormShape(
  shape: unknown,
  key: string,
  value: unknown,
): unknown {
  if (value === null || value === undefined) return undefined

  if (key === 'educations') {
    return Array.isArray(value) ? value.map(toEducationEntry) : undefined
  }
  if (key === 'achievements') {
    return Array.isArray(value) ? value.map(toAchievementEntry) : undefined
  }
  /* Must precede the generic array branch below, whose `.map(String)` would
     turn every pick into "[object Object]". A draft saved while these were tag
     lists holds strings; each one becomes a title, which is the same leniency
     the server's `clean_media_picks` applies. */
  if (MEDIA_PICK_KEYS.has(key)) {
    if (typeof value === 'string') return value ? [toMediaPick({ title: value })] : []
    return Array.isArray(value) ? value.map(toMediaPick) : undefined
  }

  if (Array.isArray(shape)) {
    // A bare string is a draft from before this field became multi-select. It
    // still says what the member chose, so keep it as a one-item selection
    // rather than silently discarding their answer. The server's `_to_str_list`
    // and MultiSelect both read a lone string the same way.
    if (typeof value === 'string') return value ? [value] : []
    if (!Array.isArray(value)) return undefined
    return value.filter((v) => v !== null && v !== undefined).map(String)
  }

  if (typeof shape === 'string') {
    // An object where text belongs cannot be rendered; drop it.
    if (typeof value === 'object') return undefined
    return String(value)
  }
  if (typeof shape === 'number') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  if (typeof shape === 'boolean') return Boolean(value)

  return value
}
