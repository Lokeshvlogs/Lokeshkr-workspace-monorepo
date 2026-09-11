'use client'

import React, { useState } from 'react'
import { BookOpen, ExternalLink, Film, Music, Sparkles } from 'lucide-react'

import MediaPickField from '@/components/profile/MediaPickField'
import { ProviderGlyph, providerLabel } from '@/components/profile/providerGlyph'
import { PICK_CATEGORIES } from '@/constants/selectOptions/interests'
import type { MediaPick, PublicProfile } from '@/types/profile'

interface Props {
  profile: PublicProfile
  /** Owner-only. Without `onSave` the section is read-only. */
  onSave?: (step: number, patch: Record<string, unknown>) => Promise<boolean>
}

const ICONS: Record<string, React.ReactNode> = {
  interestsMusic: <Music size={16} />,
  interestsMovies: <Film size={16} />,
  interestsBooks: <BookOpen size={16} />,
}

/** Interests live on wizard step 4, and inline edits go through the same PATCH. */
const INTERESTS_STEP = 4

/**
 * Music, films and reading, as artwork.
 *
 * These three left `PROFILE_FIELDS` when they stopped being genre tags. They
 * had been rendering as one comma-joined line in a `<dd>`, which was already
 * poor for "Bollywood, Ghazals" and would have been absurd for "Tum Hi Ho,
 * Sholay, Godaan" - the titles are the content, and a title without its cover
 * is a list item rather than a recommendation.
 *
 * Leaving `PROFILE_FIELDS` also took away the inline pencil those fields had,
 * so the owner's copy carries its own editor. It saves through the same
 * `onSave(step, patch)` contract `EditableField` uses, so there is still one
 * write path.
 */
export default function ProfileMediaPicks({ profile, onSave }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<MediaPick[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const editable = Boolean(onSave)

  const groups = PICK_CATEGORIES.map((category) => ({
    ...category,
    picks: ((profile as any)[category.key] ?? []) as MediaPick[],
  }))

  // A visitor sees nothing when nothing was filled in; the owner always sees
  // the section, because an empty one is where they would go to fill it.
  const anything = groups.some((group) => group.picks.length > 0)
  if (!anything && !editable) return null

  const beginEdit = (key: string, picks: MediaPick[]) => {
    setError('')
    setDraft(picks.map((pick) => ({ ...pick })))
    setEditing(key)
  }

  const commit = async (key: string) => {
    setSaving(true)
    setError('')
    // Blank rows are dropped here as well as on the server: the member should
    // see the same list back that they are about to be shown.
    const cleaned = draft.filter((pick) => pick.title.trim())
    const saved = await onSave?.(INTERESTS_STEP, { [key]: cleaned })
    setSaving(false)

    if (saved) setEditing(null)
    else setError('Could not save. Please try again.')
  }

  return (
    <section className="form-section">
      <h3 className="form-section-title">
        <Sparkles size={17} className="form-section-icon" aria-hidden="true" />
        Music, films &amp; reading
      </h3>

      <div className="pick-groups">
        {groups.map((group) => {
          const isEditing = editing === group.key

          if (isEditing) {
            return (
              <div key={group.key} className="pick-group">
                <MediaPickField
                  label={group.label}
                  icon={ICONS[group.key]}
                  hint={group.hint}
                  placeholder={group.placeholder}
                  value={draft}
                  onChange={setDraft}
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="chip chip-square"
                    onClick={() => setEditing(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="chip chip-selected chip-square"
                    onClick={() => commit(group.key)}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
                {error && <p className="error-text mt-2">{error}</p>}
              </div>
            )
          }

          // A visitor is not shown a category the member left empty.
          if (group.picks.length === 0 && !editable) return null

          return (
            <div key={group.key} className="pick-group">
              <div className="pick-group-head">
                <span className="pick-group-title">
                  <span className="field-label-icon" aria-hidden="true">
                    {ICONS[group.key]}
                  </span>
                  {group.label}
                </span>
                {editable && (
                  <button
                    type="button"
                    className="profile-bio-edit"
                    onClick={() => beginEdit(group.key, group.picks)}
                    aria-label={`Edit ${group.label}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                    </svg>
                    Edit
                  </button>
                )}
              </div>

              {group.picks.length === 0 ? (
                <p className="field-value-empty">Nothing added yet.</p>
              ) : (
                <ul className="pick-cards">
                  {group.picks.map((pick, index) => (
                    <PickCard key={`${pick.url || pick.title}-${index}`} pick={pick} />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/**
 * One card. A link when there is somewhere to go, a plain figure otherwise -
 * rather than an anchor with no href, which reads as a link to a screen reader
 * and does nothing when clicked.
 */
function PickCard({ pick }: { pick: MediaPick }) {
  const inner = (
    <>
      <span className={`pick-card-art ${pick.thumbnail ? '' : 'pick-card-art-empty'}`}>
        {pick.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pick.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <ProviderGlyph provider={pick.provider} size={22} />
        )}
        {pick.url && (
          <span className="pick-card-go" aria-hidden="true">
            <ExternalLink size={13} />
          </span>
        )}
      </span>

      <span className="pick-card-text">
        <span className="pick-card-title">{pick.title}</span>
        {pick.subtitle && <span className="pick-card-sub">{pick.subtitle}</span>}
        {pick.provider && <span className="pick-card-provider">{providerLabel(pick.provider)}</span>}
      </span>
    </>
  )

  return (
    <li className="pick-card">
      {pick.url ? (
        <a href={pick.url} target="_blank" rel="noopener noreferrer" className="pick-card-link">
          {inner}
        </a>
      ) : (
        <span className="pick-card-link">{inner}</span>
      )}
    </li>
  )
}
