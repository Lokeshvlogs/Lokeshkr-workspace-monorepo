'use client'

import React, { useState } from 'react'
import { Lock } from 'lucide-react'
import { TextField } from '@lokesh-workspace/ui'

import IdentityNotice from '@/components/profile/IdentityNotice'
import { fieldIssue } from '@/lib/validation/schemas/profileWizardSchema'
import type { IdentityLock, PublicProfile, SaveField } from '@/types/profile'

interface Props {
  profile: PublicProfile
  onSave: SaveField
  lock?: IdentityLock
  silent?: boolean
}

/** Wizard step 0 owns the name, and an inline edit is the same write. */
const BASIC_STEP = 0

/**
 * The name, edited where it is read.
 *
 * Not an `EditableField`: first name and surname are two columns but one
 * allowance, so changing both has to be one save. Two separate pencils would
 * make correcting "Asha Menon" to "Aasha Nair" cost two of the two changes a
 * member gets - and leave them locked out halfway through if they saved the
 * first and then thought better of the second.
 *
 * It also has no row of its own to live in. The name is the page heading, which
 * is exactly why `HERO_FACT_KEYS` excludes it from the tiles below.
 */
export default function HeroNameEditor({ profile, onSave, lock, silent = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')

  if (lock?.locked && !editing) {
    return (
      <span className="hero-name-lock" title="Your name is fixed and cannot be changed">
        <Lock size={13} aria-hidden="true" />
      </span>
    )
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="field-edit-btn hero-name-edit"
        onClick={() => {
          setError('')
          setFirst(profile.firstName ?? '')
          setLast(profile.surname ?? '')
          setEditing(true)
        }}
        aria-label="Edit name"
        title="Edit name"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
        </svg>
      </button>
    )
  }

  const commit = async () => {
    // The same rule the wizard applies to these two fields. Without it the
    // inline editor is a way round the name validation rather than another
    // door to it.
    const issue = fieldIssue('firstName', first) ?? fieldIssue('surname', last)
    if (issue) {
      setError(issue)
      return
    }

    setSaving(true)
    setError('')
    const result = await onSave(BASIC_STEP, {
      firstName: first.trim(),
      surname: last.trim(),
    })
    setSaving(false)

    if (result.ok) setEditing(false)
    else setError(result.detail || 'Could not save. Please try again.')
  }

  return (
    <div className="hero-name-editor">
      <IdentityNotice lock={lock} what="name" editing silent={silent} />

      <div className="form-grid-2">
        <TextField
          id="hero-first-name"
          label="First name"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
        />
        <TextField
          id="hero-surname"
          label="Surname"
          value={last}
          onChange={(e) => setLast(e.target.value)}
        />
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="chip chip-square"
          onClick={() => setEditing(false)}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="chip chip-selected chip-square"
          onClick={commit}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {error && <p className="error-text mt-2">{error}</p>}
    </div>
  )
}
