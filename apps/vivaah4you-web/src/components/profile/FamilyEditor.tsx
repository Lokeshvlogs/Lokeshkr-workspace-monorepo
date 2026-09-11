'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChipGroup, TextField } from '@lokesh-workspace/ui'

import Avatar from '@/components/profile/Avatar'
import { RELATIONS, RELATION_LABEL, type FamilyMember, type Relation } from '@/lib/family'
import { detailMessage } from '@/lib/errors'

/* A nuclear family has no grandparents to add, and offering them there is an
   invitation to describe a household that was not claimed. */
const NUCLEAR_RELATIONS = RELATIONS.filter(
  (r) => r !== 'grandfather' && r !== 'grandmother' && r !== 'other',
)

const optionsFor = (extended: boolean) =>
  (extended ? RELATIONS : NUCLEAR_RELATIONS).map((value) => ({
    value,
    label: RELATION_LABEL[value],
  }))

interface Props {
  onClose?: () => void
  /**
   * Joint and extended families get grandparents and "other" offered, and the
   * heading says so - those are exactly the people the sibling counts above
   * cannot describe.
   */
  extended?: boolean
  /** Hides the "Done" button where the editor is part of a larger form. */
  embedded?: boolean
}

/**
 * Adding and editing the people in your family.
 *
 * A photo can only be attached after the row exists, because the upload needs
 * an id to attach to - so adding is two steps and the second one is optional.
 */
export default function FamilyEditor({ onClose, extended = false, embedded = false }: Props) {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [relation, setRelation] = useState<Relation>('father')
  const [name, setName] = useState('')
  const [occupation, setOccupation] = useState('')
  const [about, setAbout] = useState('')
  const [isMarried, setIsMarried] = useState(false)
  /** The row being edited, or null when the form is adding a new person. */
  const [editingId, setEditingId] = useState<number | null>(null)

  const uploadFor = useRef<number | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const load = async () => {
    const data = await fetch('/api/family/me').then((r) => r.json()).catch(() => null)
    setMembers(Array.isArray(data?.results) ? data.results : [])
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  const add = async () => {
    setSaving(true)
    setError('')

    const response = await fetch('/api/family/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relation, name, occupation, about, isMarried, position: members.length }),
    }).catch(() => null)

    setSaving(false)

    if (!response?.ok) {
      const data = await response?.json().catch(() => null)
      setError(detailMessage(data, 'Could not add them. Please try again.'))
      return
    }

    resetForm()
    await load()
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setOccupation('')
    setAbout('')
    setIsMarried(false)
  }

  /** Loads a row into the form. There was no way to correct one before. */
  const beginEdit = (member: FamilyMember) => {
    setEditingId(member.id)
    setRelation(member.relation)
    setName(member.name)
    setOccupation(member.occupation)
    setAbout(member.about)
    setIsMarried(member.isMarried)
  }

  const save = async () => {
    if (editingId === null) return add()

    setSaving(true)
    setError('')

    const response = await fetch(`/api/family/me/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relation, name, occupation, about, isMarried, position: 0 }),
    }).catch(() => null)

    setSaving(false)

    if (!response?.ok) {
      const data = await response?.json().catch(() => null)
      setError(detailMessage(data, 'Could not save. Please try again.'))
      return
    }

    resetForm()
    await load()
  }

  const remove = async (id: number) => {
    await fetch(`/api/family/me/${id}`, { method: 'DELETE' }).catch(() => {})
    await load()
  }

  const pickPhoto = (id: number) => {
    uploadFor.current = id
    fileInput.current?.click()
  }

  const upload = async (file: File) => {
    const id = uploadFor.current
    if (!id) return

    const form = new FormData()
    form.append('file', file)

    const response = await fetch(`/api/family/me/${id}/photo`, {
      method: 'POST',
      body: form,
    }).catch(() => null)

    if (!response?.ok) {
      const data = await response?.json().catch(() => null)
      setError(detailMessage(data, 'Could not upload that photo.'))
      return
    }
    await load()
  }

  return (
    <section className="form-section">
      <div className="family-head">
        <p className="form-section-title">
          {extended ? 'Everyone in your household' : 'Your family'}
        </p>
        {!embedded && onClose && (
          <button type="button" className="profile-bio-edit" onClick={onClose}>
            Done
          </button>
        )}
      </div>

      {loading ? (
        <div className="panel-skeleton-rows mt-3" aria-hidden="true">
          <span />
        </div>
      ) : (
        <>
          {members.length > 0 && (
            <ul className="family-edit-list">
              {members.map((member) => (
                <li key={member.id} className="family-edit-row">
                  <Avatar
                    src={member.photo}
                    name={member.name || member.relationLabel}
                    className="family-edit-photo"
                    decorative
                  />

                  <span className="min-w-0 flex-1">
                    <span className="family-edit-name">
                      {member.name || member.relationLabel}
                    </span>
                    <span className="family-edit-meta">
                      {[member.relationLabel, member.occupation].filter(Boolean).join(' · ')}
                    </span>
                  </span>

                  <button
                    type="button"
                    className="chip chip-square"
                    onClick={() => beginEdit(member)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="chip chip-square"
                    onClick={() => pickPhoto(member.id)}
                  >
                    {member.photo ? 'Change photo' : 'Add photo'}
                  </button>
                  <button
                    type="button"
                    className="chip chip-square"
                    onClick={() => remove(member.id)}
                    aria-label={`Remove ${member.name || member.relationLabel}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="family-add">
            <ChipGroup
              label="Who is this?"
              options={optionsFor(extended)}
              value={relation}
              onChange={(v) => setRelation(v as Relation)}
            />

            <div className="form-grid-2 mt-3">
              <TextField
                id="family-name"
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                id="family-occupation"
                label="What they do"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>

            <div className="mt-3">
              <ChipGroup
                label="Married?"
                options={[
                  { value: 'no', label: 'No' },
                  { value: 'yes', label: 'Yes' },
                ]}
                value={isMarried ? 'yes' : 'no'}
                onChange={(v) => setIsMarried(v === 'yes')}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn bg-color-primary text-white"
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Saving…' : editingId === null ? 'Add to family' : 'Save changes'}
              </button>

              {editingId !== null && (
                <button type="button" className="chip chip-square" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>

            {error && <p className="error-text mt-2">{error}</p>}
          </div>

          {/* One input for every row: the target is held in a ref, so there is
              no hidden input per member cluttering the DOM. */}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload(file)
              e.target.value = ''
            }}
          />
        </>
      )}
    </section>
  )
}
