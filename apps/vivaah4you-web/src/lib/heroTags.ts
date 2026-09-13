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

/**
 * The tag promoted out of the row and up under the name.
 *
 * Where somebody lives is the first thing a reader checks after the name, and
 * in a wrapped row of six pills it was wherever it happened to land.
 */
export const HERO_PLACE_KEY = 'currentCity'

/** Which search parameter each promoted field narrows on. */
const FILTER_PARAM: Record<string, string> = {
  currentCity: 'city',
  profession: 'profession',
  salaryAmount: 'salary',
  mothertongue: 'motherTongue',
  religion: 'religion',
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
export function heroTags(
  profile: PublicProfile,
  { owner = false }: { owner?: boolean } = {},
): HeroTag[] {
  const tags: HeroTag[] = []

  for (const def of heroTagFields()) {
    const raw = (profile as unknown as Record<string, unknown>)[def.key]
    const label = labelFor(def.key, raw)

    // An unanswered tag is dropped for a visitor and KEPT for the owner, where
    // the blank is the prompt - the same rule `hero-facts` already applies.
    //
    // This is not tidiness. A promoted field has no section row to fall back
    // to: `fieldsBySection` withholds every HERO_TAG_KEY before it checks
    // `owner`. So dropping a blank one here leaves nowhere on the page to set
    // it again. `religion` carries `resets: ['community']`, which makes that a
    // two-click trap - change your religion and the community pill would
    // vanish for good - and `currentCity` has the same hole today, reachable by
    // changing your country.
    if (!label && !owner) continue

    const param = FILTER_PARAM[def.key]
    const short = label ? tagLabel(def.key, label) : ''
    tags.push({
      id: def.key,
      icon: iconFor(def.key) as FieldIcon | undefined,
      label: short,
      title: short === label ? undefined : label,
      srLabel: def.label,
      def,
      // The filter carries the STORED value, never the shortened label: the
      // search matches the same composed string the profile holds. A blank
      // tag is the owner's prompt to fill it in, not something to search on.
      filter: param && label ? { param, value: String(raw) } : undefined,
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
