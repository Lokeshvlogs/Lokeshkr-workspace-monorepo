import type { ComponentType } from 'react'

import { heroTagFields, type ProfileFieldDef } from '@/lib/profileFields'
import { iconFor } from '@/lib/profileIcons'
import { labelFor } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

type FieldIcon = ComponentType<{ className?: string; strokeWidth?: number; size?: number }>

export interface HeroTag {
  id: string
  icon: FieldIcon | undefined
  /** What the pill reads. */
  label: string
  /** The unabbreviated value, when `label` had to be shortened to fit. */
  title?: string
  /** The term it answers, kept for screen readers since the pill shows no label. */
  srLabel: string
  /** Present when the owner may edit this in place. */
  def?: ProfileFieldDef
  /** Present when the tag can be followed into search. */
  filter?: { param: string; value: string }
}

/**
 * What a tag reads, where the stored value is too long to wear as one.
 *
 * `currentCity` holds a composed `"Los Angeles, California, United States"`,
 * which is the right thing to filter on and far too long for a pill. The city
 * alone is the useful part: whether someone is abroad is already said by the
 * NRI tag beside it, and the full string stays in the `title`.
 */
function tagLabel(key: string, full: string): string {
  if (key !== 'currentCity') return full
  return full.split(',')[0].trim() || full
}

/** Which search parameter each promoted field narrows on. */
const FILTER_PARAM: Record<string, string> = {
  currentCity: 'city',
  profession: 'profession',
  salaryAmount: 'salary',
  mothertongue: 'motherTongue',
  community: 'community',
}

/**
 * The pills under the display picture.
 *
 * Two kinds, and the difference matters to the caller: field-backed tags carry
 * a `def`, so the owner gets the same inline editor the fact tiles use;
 * residency tags are computed and carry none, so they stay read-only text even
 * on your own profile.
 *
 * Nothing here decides who is an NRI. That rule lives in Django
 * (`apps/profiles/residency.py`) because the `nri` search filter has to apply
 * exactly the same test, and a second copy of it here would drift silently.
 * This function reads the flags the API already computed.
 */
export function heroTags(profile: PublicProfile): HeroTag[] {
  const tags: HeroTag[] = []

  for (const def of heroTagFields()) {
    const raw = (profile as unknown as Record<string, unknown>)[def.key]
    const label = labelFor(def.key, raw)
    if (!label) continue

    const param = FILTER_PARAM[def.key]
    const short = tagLabel(def.key, label)
    tags.push({
      id: def.key,
      icon: iconFor(def.key) as FieldIcon | undefined,
      label: short,
      title: short === label ? undefined : label,
      srLabel: def.label,
      def,
      // The filter carries the STORED value, never the shortened label: the
      // search matches the same composed string the profile holds.
      filter: param ? { param, value: String(raw) } : undefined,
    })
  }

  if (profile.isNri) {
    tags.push({
      id: 'nri',
      icon: iconFor('settleAbroad') as FieldIcon | undefined,
      label: 'NRI',
      srLabel: 'Living abroad',
      filter: { param: 'nri', value: '1' },
    })
  }

  const residency = profile.residencyTag
  if (residency) {
    // Citizenship arrives as an ISO-2 code and is labelled here, where the
    // country list already lives. A visa label cannot be: its options are
    // per-country catalog data the client never holds, so the server sends the
    // finished string.
    const label =
      residency.kind === 'citizenship'
        ? labelFor('citizenshipCountry', residency.value)
        : residency.label

    if (label) {
      tags.push({
        id: `residency-${residency.kind}`,
        icon: iconFor(
          residency.kind === 'citizenship' ? 'citizenshipCountry' : 'visaStatus',
        ) as FieldIcon | undefined,
        label,
        srLabel: residency.kind === 'citizenship' ? 'Citizen of' : 'Residency status',
        filter:
          residency.kind === 'citizenship'
            ? { param: 'citizenship', value: residency.value }
            : // Residency status is not a useful thing to search on by itself -
              // "everyone on an H-1B" is a much narrower question than anyone
              // asks. The tag falls back to the broader one it implies.
              { param: 'nri', value: '1' },
      })
    }
  }

  return tags
}
