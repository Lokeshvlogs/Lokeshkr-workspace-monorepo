import { labelFor } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

export interface TimelineNode {
  key: string
  year: number | null
  level: string
  fieldOfStudy: string
  institution: string
  country: string
  /** True for the single node synthesised from the derived scalars. */
  derived: boolean
}

/**
 * A member's qualifications, newest first.
 *
 * `educations[]` has been delivered by the API since the education table
 * landed and rendered nowhere until now - the profile showed only the three
 * derived scalars (`educationLevel`, `fieldOfStudy`, `collegeUniversity`),
 * which are a flattening of the same rows.
 *
 * Expect it to look sparse. Measured against the dev data: `completionYear` is
 * null on every row - the wizard asks for it and members skip it - and only one
 * profile in twenty-two has more than a single qualification. So this has to
 * read well as one undated node, which is the common case today, and grow into
 * a dated list as members fill it in. The degradations are all deliberate:
 *
 * - no year on a node: no empty slot, no placeholder dash;
 * - no years anywhere: keep the order the API sent, which is already the
 *   member's own `position` ordering;
 * - no rows at all: one synthetic node from the derived scalars, so the seven
 *   profiles predating the table keep their education on the page;
 * - rows AND scalars: only the rows. The scalars *are* the top row flattened,
 *   so rendering both would duplicate it verbatim.
 */
export function educationTimeline(profile: PublicProfile): TimelineNode[] {
  const entries = profile.educations ?? []

  if (entries.length > 0) {
    return entries
      .map((entry, index) => ({
        key: `${index}-${entry.institutionName || entry.level}`,
        year: entry.completionYear ?? null,
        level: labelFor('educationLevel', entry.level),
        fieldOfStudy: labelFor('fieldOfStudy', entry.fieldOfStudy),
        institution: entry.institutionName || '',
        country: labelFor('currentCountry', entry.country),
        derived: false,
      }))
      .sort((a, b) => {
        // Undated rows sink rather than sorting as year zero, and ties keep the
        // order the member chose.
        if (a.year === b.year) return 0
        if (a.year === null) return 1
        if (b.year === null) return -1
        return b.year - a.year
      })
  }

  const level = labelFor('educationLevel', profile.educationLevel)
  const fieldOfStudy = labelFor('fieldOfStudy', profile.fieldOfStudy)
  const institution = profile.collegeUniversity || ''
  if (!level && !fieldOfStudy && !institution) return []

  /* The hero prints `educationLevel` on a line of its own now, so a synthetic
     node carrying ONLY the level is a verbatim second copy - same `labelFor`,
     same key, same value. It earns its place the moment it also carries a field
     of study or an institution, because neither of those has a def, a row or a
     hero line: this node is their only render site.
     Row-backed timelines are untouched. Their top node repeats the level too,
     but beside a year, a subject and an institution - a summary opening into a
     record rather than a duplicate. */
  if (!fieldOfStudy && !institution) return []

  return [
    {
      key: 'derived',
      year: null,
      level,
      fieldOfStudy,
      institution,
      country: '',
      derived: true,
    },
  ]
}
