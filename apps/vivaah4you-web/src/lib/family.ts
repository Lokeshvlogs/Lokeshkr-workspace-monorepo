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
