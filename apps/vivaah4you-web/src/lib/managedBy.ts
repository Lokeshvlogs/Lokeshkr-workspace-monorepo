import { possessivePronoun } from '@/lib/profileDisplay'

/**
 * Who is running a profile, said in the third person.
 *
 * The vocabulary is mirrored from `apps/profiles/managed_by.py` — the KEYS are
 * the contract, the phrasing is ours. Django still sends its own finished
 * `managedByLabel`; this page stops rendering it, because the wording here is
 * gendered and the server has no business growing a gender parameter to say so.
 * (The wizard's `MANAGED_BY_OPTIONS` already mirrors the same keys, so this is
 * the established pattern here rather than a new one.)
 */
const RELATION: Record<string, string> = {
  parent: 'parent',
  sibling: 'sibling',
  relative: 'relative',
  guardian: 'guardian',
  friend: 'friend',
}

export function managedByLine(
  managedBy: string | undefined,
  gender: string | undefined,
  { owner = false }: { owner?: boolean } = {},
): string {
  if (managedBy === 'self') {
    // First person on your own page, where "self" would be talking about the
    // reader in the third person.
    return owner ? 'You manage this profile' : 'Profile managed by self'
  }

  const relation = RELATION[managedBy ?? '']
  // `resolve()` returns "" when it genuinely cannot tell - render nothing
  // rather than guess, which is what both call sites already did.
  if (!relation) return ''

  /*
   * The indefinite article on your own page, never "your", and this is
   * load-bearing rather than style: the account holder reading /profile/me may
   * BE the parent running their daughter's profile, so "your parent" would be
   * addressed to the wrong person entirely. Which is also why the owner line
   * carries no pronoun and needs no gender.
   */
  if (owner) return `Profile managed by a ${relation}`

  return `Profile managed by ${possessivePronoun(gender)} ${relation}`
}
