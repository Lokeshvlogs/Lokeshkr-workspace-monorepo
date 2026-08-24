/**
 * Local draft of the profile-registration wizard.
 *
 * The draft is stamped with the profile it belongs to. Anything else on the
 * device is ignored and deleted, so a half-finished wizard can never bleed from
 * one account into another - which is what happened when the draft was a bare
 * blob keyed only by name: after logging out and registering a second user, the
 * first user's answers were replayed over the new (empty) profile and looked
 * like saved data.
 *
 * Clearing on logout alone is not enough, because a session can end without
 * logout ever running (token expiry, another tab, cleared cookies).
 */

const DRAFT_KEY = 'profileRegisterDraft'

// Pre-namespacing keys. Still purged so drafts already sitting in a browser
// from an earlier build cannot resurface.
const LEGACY_KEYS = ['profileRegisterForm', 'profileRegisterStep']

export interface ProfileDraft<T = Record<string, unknown>> {
  owner: string
  form: Partial<T>
  step: number
}

function isBrowser() {
  return typeof window !== 'undefined'
}

/** Stable per-account key. profile_id is minted at registration; email backs it up. */
export function draftOwnerKey(profile: { profile_id?: string; email?: string } | null): string {
  if (!profile) return ''
  return profile.profile_id || profile.email || ''
}

export function readProfileDraft<T>(owner: string): ProfileDraft<T> | null {
  if (!isBrowser() || !owner) return null

  // Never let a pre-namespacing draft through - its owner is unknowable.
  LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key))

  const raw = window.localStorage.getItem(DRAFT_KEY)
  if (!raw) return null

  try {
    const draft = JSON.parse(raw) as ProfileDraft<T>
    if (!draft || draft.owner !== owner) {
      // Belongs to somebody else (or a pre-namespacing build) - discard it.
      window.localStorage.removeItem(DRAFT_KEY)
      return null
    }
    return draft
  } catch {
    window.localStorage.removeItem(DRAFT_KEY)
    return null
  }
}

export function saveProfileDraft<T>(owner: string, form: Partial<T>, step: number): void {
  if (!isBrowser() || !owner) return
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ owner, form, step }))
}

/** Called on logout and once the wizard is submitted. */
export function clearProfileDraft(): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(DRAFT_KEY)
  LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key))
}
