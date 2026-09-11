'use client'

import React, { useEffect, useRef, useState } from 'react'

import { fieldIssue } from '@/lib/validation/schemas/profileWizardSchema'

const MAX_LENGTH = 600

interface Props {
  /** The bio text. Empty renders the prompt for the owner and nothing for a visitor. */
  value: string
  /** Heading above the quote - "About me", or "About Priya" on a match. */
  heading: string
  /** Owner-only. Without `onSave` the bio is read-only. */
  onSave?: (step: number, patch: Record<string, unknown>) => Promise<boolean>
  /**
   * A draft built from the member's own answers, offered but never applied.
   *
   * Loading it straight into the bio would publish words the member has not
   * read, on a profile that is theirs; it only ever reaches the editor, where
   * saving is still an explicit act.
   */
  suggestion?: string
  /** One line on why a bio is worth writing, shown beside the offer. */
  advantage?: string
  /**
   * Open the editor pre-filled with the suggestion on arrival.
   *
   * Set once, on the hop from the last wizard step: the box that used to be in
   * step 1 is being offered here instead, so it has to be visible rather than
   * waiting behind a button nobody was told about.
   */
  autoSuggest?: boolean
}

/**
 * The member's bio, and the only place it is rendered.
 *
 * It used to appear twice on every profile: once as a hand-written card here,
 * and again as a row inside the generated "About" section, because `aboutMe`
 * was also registered in `PROFILE_FIELDS`. That entry is gone - this component
 * owns the field, which is why it carries its own editor rather than leaning on
 * `EditableField`.
 *
 * Set as a pull-quote: it is the one piece of a profile written in the member's
 * own voice, and running it as another grey field row buried that.
 */
export default function ProfileBio({
  value,
  heading,
  onSave,
  suggestion = '',
  advantage = '',
  autoSuggest = false,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  /* True while the open editor holds generated text the member has not edited,
     which is the only time the "suggested" note is honest. */
  const [fromSuggestion, setFromSuggestion] = useState(false)

  const editable = Boolean(onSave)
  const canSuggest = editable && !value && Boolean(suggestion)

  /* Fires once. The profile reloads after every inline save, so without the
     guard a member who cleared their bio would be handed the suggestion again
     on the next render. */
  const autoStarted = useRef(false)
  useEffect(() => {
    if (!autoSuggest || autoStarted.current || !canSuggest) return
    autoStarted.current = true
    setError('')
    setDraft(suggestion)
    setFromSuggestion(true)
    setEditing(true)
  }, [autoSuggest, canSuggest, suggestion])

  // A visitor looking at an empty bio gets nothing at all - an "not written
  // yet" placeholder on someone else's profile is noise about a person who
  // simply has not got to it.
  if (!value && !editable) return null

  const beginEdit = (seed = value) => {
    setError('')
    setDraft(seed)
    setFromSuggestion(seed !== value)
    setEditing(true)
  }

  const commit = async () => {
    /* The wizard used to run this on its own About-me box; that box is gone,
       so the rule has to travel with the field. Without it the one control
       that still writes `aboutMe` is the one place a phone number or an email
       address could be published. */
    const issue = fieldIssue('aboutMe', draft)
    if (issue) {
      setError(issue)
      return
    }

    setSaving(true)
    setError('')
    // Step 0 is where the wizard keeps `aboutMe`; the same save endpoint backs
    // both, so an edit here and an edit in the wizard are the same write.
    const saved = await onSave?.(0, { aboutMe: draft.trim() })
    setSaving(false)

    if (saved) setEditing(false)
    else setError('Could not save. Please try again.')
  }

  if (editing) {
    return (
      <section className="form-section">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-color-primary-text">{heading}</span>
          <div className="flex gap-2">
            {/* Same visual language as EditableField, so an inline edit looks
                the same wherever it happens. */}
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="chip chip-square"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commit}
              className="chip chip-selected chip-square"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {fromSuggestion && (
          <p className="bio-suggest-note">
            Written from your own answers — change anything you like. Nothing is saved
            until you press Save.
          </p>
        )}

        <textarea
          className="textarea-field"
          value={draft}
          maxLength={MAX_LENGTH}
          autoFocus
          onChange={(e) => {
            setDraft(e.target.value)
            setFromSuggestion(false)
          }}
        />
        <p className="textarea-count">
          {draft.length} / {MAX_LENGTH}
        </p>

        {error && <p className="error-text mt-2">{error}</p>}
      </section>
    )
  }

  return (
    <section className="form-section profile-bio-card">
      <div className="profile-bio-head">
        <h3 className="form-section-title">{heading}</h3>
        {editable && (
          <button
            type="button"
            onClick={() => beginEdit()}
            className="profile-bio-edit"
            aria-label={`Edit ${heading}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {value ? (
        <blockquote className="profile-bio">{value}</blockquote>
      ) : (
        <>
          <p className="profile-bio-empty">
            Say a little about yourself — this is the part people actually read.
          </p>
          {advantage && <p className="bio-advantage">{advantage}</p>}
          {canSuggest && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="chip chip-selected chip-square"
                onClick={() => beginEdit(suggestion)}
              >
                Suggest one for me
              </button>
              <button type="button" className="chip chip-square" onClick={() => beginEdit()}>
                Write my own
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
