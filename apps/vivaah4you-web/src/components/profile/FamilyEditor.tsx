'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChipGroup, TextField } from '@lokesh-workspace/ui'

import Avatar from '@/components/profile/Avatar'
import { RELATIONS, RELATION_LABEL, type FamilyMember, type Relation } from '@/lib/family'

const RELATION_OPTIONS = RELATIONS.map((value) => ({ value, label: RELATION_LABEL[value] }))

interface Props {
  onClose: () => void
}

/**
 * Adding and editing the people in your family.
 *
 * A photo can only be attached after the row exists, because the upload needs
 * an id to attach to - so adding is two steps and the second one is optional.
 */
export default function FamilyEditor({ onClose }: Props) {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [relation, setRelation] = useState<Relation>('father')
  const [name, setName] = useState('')
  const [occupation, setOccupation] = useState('')

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
      body: JSON.stringify({ relation, name, occupation, position: members.length }),
    }).catch(() => null)

    setSaving(false)

    if (!response?.ok) {
      const data = await response?.json().catch(() => null)
      setError(data?.detail ?? 'Could not add them. Please try again.')
      return
    }

    setName('')
    setOccupation('')
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
      setError(data?.detail ?? 'Could not upload that photo.')
      return
    }
    await load()
  }

  return (
    <section className="form-section">
      <div className="family-head">
        <p className="form-section-title">Your family</p>
        <button type="button" className="profile-bio-edit" onClick={onClose}>
          Done
        </button>
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
              options={RELATION_OPTIONS}
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

            <button
              type="button"
              className="btn bg-color-primary mt-3 text-white"
              onClick={add}
              disabled={saving}
            >
              {saving ? 'Adding…' : 'Add to family'}
            </button>

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
