import type { SelectOption } from '@lokesh-workspace/ui'

/**
 * Religious outlook as a stance plus a qualifier, replacing the old 0-10
 * slider. A number said nothing useful on a profile; "Religious - Practising"
 * is something a family can actually match on.
 */
export const RELIGIOSITY_OPTIONS: SelectOption[] = [
  { value: 'religious', label: 'Religious' },
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'agnostic', label: 'Agnostic' },
  { value: 'atheist', label: 'Atheist' },
]

export const RELIGIOSITY_DETAIL_OPTIONS: Record<string, SelectOption[]> = {
  religious: [
    { value: 'devout', label: 'Devout — faith guides daily life' },
    { value: 'practising', label: 'Practising — regular prayers and festivals' },
    { value: 'occasional', label: 'Occasionally observant' },
    { value: 'traditional', label: 'Traditional — follows customs' },
  ],
  spiritual: [
    { value: 'not_religious', label: 'Spiritual but not religious' },
    { value: 'meditative', label: 'Into meditation and mindfulness' },
    { value: 'seeker', label: 'Exploring different philosophies' },
  ],
  agnostic: [
    { value: 'open', label: 'Open to faith, not certain' },
    { value: 'questioning', label: 'Still questioning' },
    { value: 'respectful', label: 'Respects all beliefs' },
  ],
  atheist: [
    { value: 'secular', label: 'Secular outlook' },
    { value: 'cultural', label: 'Joins customs socially, not religiously' },
    { value: 'rationalist', label: 'Rationalist' },
  ],
}

export function religiosityDetailOptions(primary: string): SelectOption[] {
  return RELIGIOSITY_DETAIL_OPTIONS[primary] ?? []
}

/** Father / mother status, phrased the way matrimonial profiles usually do. */
export const PARENT_OCCUPATION_OPTIONS: SelectOption[] = [
  { value: 'employed', label: 'Employed' },
  { value: 'business', label: 'Business owner' },
  { value: 'professional', label: 'Professional' },
  { value: 'government', label: 'Government service' },
  { value: 'homemaker', label: 'Homemaker' },
  { value: 'retired', label: 'Retired' },
  { value: 'not_employed', label: 'Not employed' },
  { value: 'passed_away', label: 'Passed away' },
]

export const SIBLING_COUNT_OPTIONS: SelectOption[] = Array.from({ length: 7 }, (_, i) => ({
  value: String(i),
  label: i === 6 ? '6+' : String(i),
}))
