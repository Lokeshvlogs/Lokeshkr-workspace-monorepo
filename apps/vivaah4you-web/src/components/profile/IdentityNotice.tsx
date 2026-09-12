import React from 'react'
import { AlertTriangle, Lock } from 'lucide-react'

import type { IdentityLock } from '@/types/profile'

interface Props {
  lock?: IdentityLock
  /** How the field reads in a sentence: "name", "date of birth". */
  what: string
  /**
   * Whether the member has started editing this field.
   *
   * The warning is worth reading exactly once, at the moment it matters. Shown
   * permanently it became furniture: a first-time registrant met an amber box
   * about changing their name before they had typed one, which is the surest
   * way to teach somebody to ignore the next warning.
   *
   * The locked state ignores this - it explains why a control is inert, and a
   * member who cannot edit a field has nothing to start.
   */
  editing?: boolean
  /**
   * Suppresses everything, warning and locked state alike.
   *
   * Set while somebody is registering for the first time. Nothing they type is
   * a change yet: the first value for each field is free, so there is genuinely
   * nothing to warn about.
   */
  silent?: boolean
  /**
   * Warn regardless of `editing` and `silent`.
   *
   * For gender alone, and only because gender alone is filled in *for* the
   * member - derived at registration from whether they are looking for a bride
   * or a groom. There is no moment where they start editing it, and the first
   * press of Continue is what commits it, so the two rules that work for every
   * other field would leave the one irreversible field unannounced.
   */
  always?: boolean
}

/**
 * What a member is allowed to do to a fact that identifies them.
 *
 * One component for the wizard and the profile editor both, so the rule is
 * worded once. The counts it reports come from the server (`identity.py` owns
 * them) rather than being recomputed here, because a client-side copy would
 * only ever be a guess that could disagree with the refusal it is trying to
 * prevent.
 */
export default function IdentityNotice({
  lock,
  what,
  editing = false,
  silent = false,
  always = false,
}: Props) {
  if (!lock) return null
  if (silent && !always) return null

  if (lock.locked) {
    return (
      <p className="identity-note identity-note-locked" role="status">
        <Lock size={13} aria-hidden="true" />
        Your {what} is now fixed and can no longer be changed.
      </p>
    )
  }

  const last = lock.changesLeft <= 1

  /* A field with one change left warns without waiting to be provoked: the next
     edit is the irreversible one, and finding that out afterwards is no use.
     This needs no first-registration exception - every group still has its full
     allowance then, so the state cannot arise. */
  if (!editing && !always && !last) return null

  return (
    <p className="identity-note" role="status">
      <AlertTriangle size={13} aria-hidden="true" />
      <span>
        {last ? (
          <>Please check this carefully — it is the last time your {what} can be changed!</>
        ) : (
          <>
            Careful: your {what} can only be changed {lock.changesLeft} more times, and
            only within 24 hours of the first change. After that it is permanent.
          </>
        )}
      </span>
    </p>
  )
}
