import type { ComponentType } from 'react'

import { displayValue } from '@/components/profile/EditableField'
import { familyFactFields, type ProfileFieldDef } from '@/lib/profileFields'
import { iconFor } from '@/lib/profileIcons'
import { FAMILY_TYPE_LABELS } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

type FieldIcon = ComponentType<{ className?: string; strokeWidth?: number }>

export interface FamilyFact {
  id: string
  icon: FieldIcon | undefined
  /** What the pill reads. */
  label: string
  /** The unabbreviated value, when `label` had to be shortened. */
  title?: string
  srLabel: string
  def: ProfileFieldDef
  /**
   * Whether this fact is proof the member told us something about their family.
   *
   * False for `familyType` and `livesWithFamily`, and that is the whole reason
   * this flag exists: Django gives them non-null defaults - `family_type`
   * defaults to 0, which is "Nuclear", and `lives_with_family` to `True`
   * (models.py:201-202). They are therefore "answered" on every profile ever
   * created. Treat them as evidence and every single profile grows a family
   * card reading "Nuclear · Lives with family", including members who have
   * told us nothing at all.
   */
  evidence: boolean
  /** An input to the city list rather than a claim about the family. */
  feeder?: boolean
}

/** Facts that only exist to build the city dropdown for the owner. */
const FEEDERS = new Set(['familyLivingInCountry', 'familyLivingInState'])

/** Fields whose stored value is answered-by-default, so proves nothing. */
const DEFAULTED = new Set(['familyType', 'livesWithFamily'])

/**
 * The value a pill shows, where the stored one does not read as a statement.
 *
 * The tree above says who the family is; these say how and where it lives, so
 * each pill has to stand on its own. "Yes" beside a house glyph is a riddle;
 * "Lives with family" is a fact.
 */
function factLabel(key: string, profile: PublicProfile, stored: string): string {
  if (key === 'familyLivingInCity') {
    // Stored composed as "Jaipur, Rajasthan, India"; the city carries it.
    return stored.split(',')[0].trim() || stored
  }
  if (key === 'familyType') {
    const name = FAMILY_TYPE_LABELS[profile.familyType]
    return name ? `${name} family` : ''
  }
  if (key === 'livesWithFamily') {
    return profile.livesWithFamily ? 'Lives with family' : 'Lives away from family'
  }
  return stored
}

/**
 * The household band under the family tree.
 *
 * Where the Family panel used to be. The tree answers "who"; these answer
 * "where, and how they live", which is why they belong beside it rather than
 * in a card three panels further down.
 */
export function familyFacts(
  profile: PublicProfile | null | undefined,
  { owner = false }: { owner?: boolean } = {},
): FamilyFact[] {
  if (!profile) return []

  const facts: FamilyFact[] = []

  for (const def of familyFactFields({ owner })) {
    const stored = displayValue(def, profile)
    const label = factLabel(def.key, profile, stored)

    // Blank is dropped for a visitor and kept for the owner, where it is the
    // prompt - the same rule the hero tags and fact tiles follow.
    if (!label && !owner) continue

    facts.push({
      id: def.key,
      icon: iconFor(def.key) as FieldIcon | undefined,
      label,
      title: def.key === 'familyLivingInCity' && stored !== label ? stored : undefined,
      srLabel: def.label,
      def,
      evidence: !DEFAULTED.has(def.key) && Boolean(label),
      feeder: FEEDERS.has(def.key) || undefined,
    })
  }

  return facts
}

/** Whether the member has actually said anything about their family. */
export function hasFamilyFacts(profile: PublicProfile | null | undefined): boolean {
  return familyFacts(profile).some((fact) => fact.evidence)
}
