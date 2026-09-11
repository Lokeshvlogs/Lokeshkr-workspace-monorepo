export const RELATIONS = [
  'father',
  'mother',
  'brother',
  'sister',
  'grandfather',
  'grandmother',
  'other',
] as const

export type Relation = (typeof RELATIONS)[number]

export const RELATION_LABEL: Record<Relation, string> = {
  father: 'Father',
  mother: 'Mother',
  brother: 'Brother',
  sister: 'Sister',
  grandfather: 'Grandfather',
  grandmother: 'Grandmother',
  other: 'Other',
}

export interface FamilyMember {
  /** Negative on a derived placeholder - it has no row to address. */
  id: number
  relation: Relation
  relationLabel: string
  name: string
  occupation: string
  about: string
  isMarried: boolean
  photo: string | null
  /** 0 is the member's own row; older generations are negative. */
  generation: number
  position: number
  /**
   * Implied by the wizard's counts rather than entered as a person.
   *
   * The wizard has always collected "2 brothers, father: Engineer" and the
   * graph has always read named rows, which nothing but the profile editor
   * ever created - so every profile's graph was empty. A derived node fills
   * the slot until somebody names the person in it.
   */
  derived?: boolean
}

export function toFamilyMember(raw: any): FamilyMember {
  return {
    id: Number(raw?.id ?? 0),
    relation: (raw?.relation ?? 'other') as Relation,
    relationLabel: String(raw?.relation_label ?? 'Other'),
    name: String(raw?.name ?? ''),
    occupation: String(raw?.occupation ?? ''),
    about: String(raw?.about ?? ''),
    isMarried: Boolean(raw?.is_married),
    photo: raw?.photo ?? null,
    // Sent by the server rather than derived here, so the graph's layout and
    // the model's idea of who is older cannot drift apart.
    generation: Number(raw?.generation ?? 0),
    position: Number(raw?.position ?? 0),
  }
}

export interface FamilyRow {
  generation: number
  label: string
  members: FamilyMember[]
}

const ROW_LABEL: Record<number, string> = {
  [-2]: 'Grandparents',
  [-1]: 'Parents',
  0: 'Their generation',
}

/**
 * The graph's rows, oldest at the top.
 *
 * Grouping happens here rather than in the component so the same shape backs
 * both your own family and a match's, and an empty generation simply does not
 * produce a row.
 */
export function toRows(members: FamilyMember[], selfLabel = 'Their generation'): FamilyRow[] {
  const byGeneration = new Map<number, FamilyMember[]>()

  for (const member of members) {
    const list = byGeneration.get(member.generation) ?? []
    list.push(member)
    byGeneration.set(member.generation, list)
  }

  return [...byGeneration.entries()]
    .sort(([a], [b]) => a - b)
    .map(([generation, list]) => ({
      generation,
      label: generation === 0 ? selfLabel : (ROW_LABEL[generation] ?? 'Family'),
      members: list,
    }))
}

const GENERATION: Record<Relation, number> = {
  grandfather: -2,
  grandmother: -2,
  father: -1,
  mother: -1,
  brother: 0,
  sister: 0,
  other: 0,
}

/** A placeholder for somebody the counts imply but nobody has named. */
function placeholder(relation: Relation, index: number, extra: Partial<FamilyMember> = {}): FamilyMember {
  return {
    /* Always negative and unique per slot: React needs a stable key, and no
       request may ever be addressed to one of these. Built off the relation's
       position in RELATIONS rather than its generation, which is negative for
       parents and would have flipped the id positive - straight into the range
       real row ids occupy. */
    id: -(1000 + RELATIONS.indexOf(relation) * 100 + index),
    relation,
    relationLabel: RELATION_LABEL[relation],
    name: '',
    occupation: '',
    about: '',
    isMarried: false,
    photo: null,
    generation: GENERATION[relation],
    position: index,
    derived: true,
    ...extra,
  }
}

/**
 * The family the wizard's answers imply.
 *
 * `occupation` is labelled through the caller, because `father_occupation` is a
 * coded value on the server with no choices declared - the labels live only on
 * this side.
 */
export function deriveMembers(
  profile: {
    fatherOccupation?: string
    motherOccupation?: string
    brothers?: number
    brothersMarried?: number
    sisters?: number
    sistersMarried?: number
  } | null,
  label: (key: string, value: string) => string,
): FamilyMember[] {
  if (!profile) return []

  const out: FamilyMember[] = []

  if (profile.fatherOccupation) {
    out.push(placeholder('father', 0, { occupation: label('fatherOccupation', profile.fatherOccupation) }))
  }
  if (profile.motherOccupation) {
    out.push(placeholder('mother', 0, { occupation: label('motherOccupation', profile.motherOccupation) }))
  }

  // The married ones first, so a named sibling taking slot 0 inherits a
  // sensible flag rather than the counts and the picture disagreeing.
  const siblings = (
    relation: 'brother' | 'sister',
    total: number,
    married: number,
  ) => {
    for (let i = 0; i < total; i += 1) {
      out.push(placeholder(relation, i, { isMarried: i < married }))
    }
  }

  siblings('brother', Number(profile.brothers ?? 0), Number(profile.brothersMarried ?? 0))
  siblings('sister', Number(profile.sisters ?? 0), Number(profile.sistersMarried ?? 0))

  return out
}

/**
 * Named people first, placeholders for whatever the counts still imply.
 *
 * Naming one of three brothers should not produce a fourth: the named row
 * takes a slot rather than being added beside them. A relation with more named
 * people than the counts allow keeps all of them - the person is the better
 * evidence.
 */
export function mergeMembers(derived: FamilyMember[], explicit: FamilyMember[]): FamilyMember[] {
  const byRelation = new Map<Relation, FamilyMember[]>()
  for (const member of explicit) {
    const list = byRelation.get(member.relation) ?? []
    list.push(member)
    byRelation.set(member.relation, list)
  }

  const out: FamilyMember[] = []
  const used = new Map<Relation, number>()

  for (const slot of derived) {
    const named = byRelation.get(slot.relation) ?? []
    const taken = used.get(slot.relation) ?? 0

    if (taken < named.length) {
      // A named person fills this slot, but the counts still own who is
      // married - the editor cannot set that flag today.
      out.push({ ...named[taken], isMarried: named[taken].isMarried || slot.isMarried })
      used.set(slot.relation, taken + 1)
    } else {
      out.push(slot)
    }
  }

  // Anyone named beyond what the counts imply - grandparents, "other", or a
  // fourth brother - simply follows.
  for (const [relation, named] of byRelation) {
    const taken = used.get(relation) ?? 0
    out.push(...named.slice(taken))
  }

  return out
}
