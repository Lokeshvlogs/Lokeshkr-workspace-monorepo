'use client'

import React, { useState } from 'react'
import {
  BirthDateTimePicker,
  ChipGroup,
  MultiSelect,
  SelectDropdown,
  TextField,
} from '@lokesh-workspace/ui'

import FieldRow from '@/components/profile/FieldRow'
import {
  HEIGHT_FEET_OPTIONS,
  HEIGHT_INCH_OPTIONS,
  optionsForField,
  type ProfileFieldDef,
} from '@/lib/profileFields'
import {
  FAMILY_TYPE_LABELS,
  MANGLIK_LABELS,
  formatHeight,
  labelFor,
} from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
  </svg>
)

/** Human-readable value for the read-only row. */
export function displayValue(def: ProfileFieldDef, profile: PublicProfile): string {
  // Generic array guard, ahead of the per-key switch: every multi-value field
  // resolves the same way, so future ones are covered without another case.
  const raw = (profile as any)[def.key]
  if (Array.isArray(raw)) {
    return raw.length ? labelFor(def.key, raw) : ''
  }

  switch (def.key) {
    case 'height':
      return formatHeight(profile.heightFeet, profile.heightInches)
    case 'dob':
      // Owner-only field; public profiles never receive it.
      return (profile as any).dob
        ? new Date((profile as any).dob).toLocaleDateString(undefined, {
            day: 'numeric', month: 'short', year: 'numeric',
          })
        : ''
    case 'manglikLevel':
      return MANGLIK_LABELS[profile.manglikLevel] ?? ''
    case 'familyType':
      return FAMILY_TYPE_LABELS[profile.familyType] ?? ''
    case 'livesWithFamily':
      return profile.livesWithFamily ? 'Yes' : 'No'
    case 'hasChildren':
      return profile.hasChildren ? 'Yes' : 'No'
    case 'partnerAgeMin':
    case 'partnerAgeMax': {
      const value = (profile as any)[def.key]
      return value ? `${value} yrs` : ''
    }
    case 'partnerHeightMin':
    case 'partnerHeightMax': {
      const inches = Number((profile as any)[def.key] ?? 0)
      return inches ? `${Math.floor(inches / 12)} ft ${inches % 12} in` : ''
    }
    case 'brothers':
    case 'brothersMarried':
    case 'sisters':
    case 'sistersMarried': {
      const value = Number((profile as any)[def.key] ?? 0)
      // 0 siblings is a real answer, so show it rather than "Not added".
      return String(value)
    }
    case 'aboutMe':
    case 'familyAbout':
    case 'partnerAbout':
      return String((profile as any)[def.key] ?? '')
    default:
      return labelFor(def.key, (profile as any)[def.key])
  }
}

interface Props {
  def: ProfileFieldDef
  profile: PublicProfile
  /** Persists the patch; resolves false when the save failed. */
  onSave: (step: number, patch: Record<string, unknown>) => Promise<boolean>
}

export default function EditableField({ def, profile, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<Record<string, unknown>>({})

  const shown = displayValue(def, profile)

  const beginEdit = () => {
    setError('')
    if (def.editor === 'height') {
      setDraft({ heightFeet: String(profile.heightFeet || ''), heightInches: String(profile.heightInches ?? '') })
    } else if (def.editor === 'multiselect') {
      // Must come before the generic branch below: its `?? ''` fallback would
      // hand MultiSelect a string where it requires an array.
      const current = (profile as any)[def.key]
      setDraft({ [def.key]: Array.isArray(current) ? [...current] : [] })
    } else if (def.editor === 'chips' && ['manglikLevel', 'familyType'].includes(def.key)) {
      setDraft({ [def.key]: String((profile as any)[def.key] ?? 0) })
    } else if (def.editor === 'bool') {
      setDraft({ [def.key]: (profile as any)[def.key] ? 'yes' : 'no' })
    } else {
      setDraft({ [def.key]: (profile as any)[def.key] ?? '' })
    }
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setDraft({})
    setError('')
  }

  const commit = async () => {
    setSaving(true)
    setError('')

    let patch: Record<string, unknown>
    if (def.editor === 'height') {
      patch = { heightFeet: draft.heightFeet, heightInches: draft.heightInches }
    } else if (def.editor === 'multiselect') {
      // An empty array is a real answer ("no preference"), not a missing one.
      patch = { [def.key]: draft[def.key] ?? [] }
    } else if (def.editor === 'bool') {
      patch = { [def.key]: draft[def.key] === 'yes' }
    } else if (def.editor === 'chips' && ['manglikLevel', 'familyType'].includes(def.key)) {
      patch = { [def.key]: Number(draft[def.key]) }
    } else {
      patch = { [def.key]: draft[def.key] }
    }

    // Changing a country invalidates the city chosen under it.
    def.resets?.forEach((key) => {
      if (draft[def.key] !== (profile as any)[def.key]) patch[key] = ''
    })

    const ok = await onSave(def.step, patch)
    setSaving(false)
    if (ok) {
      setEditing(false)
      setDraft({})
    } else {
      setError('Could not save. Please try again.')
    }
  }

  if (!editing) {
    return (
      <FieldRow
        fieldKey={def.key}
        label={def.label}
        value={shown}
        emptyText="Not added"
        action={
          <button
            type="button"
            onClick={beginEdit}
            aria-label={`Edit ${def.label}`}
            title={`Edit ${def.label}`}
            className="field-edit-btn"
          >
            <PencilIcon />
          </button>
        }
      />
    )
  }

  const value = draft[def.key]

  return (
    <div className="field-editor">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-color-primary-text">{def.label}</span>
        <div className="flex gap-2">
          {/* Same visual language as ChipGroup: Save reads as the selected
              option, Cancel as an unselected one. */}
          <button type="button" onClick={cancel} className="chip chip-square" disabled={saving}>
            Cancel
          </button>
          <button type="button" onClick={commit} className="chip chip-selected chip-square" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {def.editor === 'text' && (
        <TextField
          id={`edit-${def.key}`}
          label={def.label}
          value={String(value ?? '')}
          onChange={(e) => setDraft({ [def.key]: e.target.value })}
        />
      )}

      {def.editor === 'select' && (
        <SelectDropdown
          label={def.label}
          placeholder=""
          options={optionsForField(def, profile)}
          value={value}
          onChange={(v) => setDraft({ [def.key]: v })}
          searchable={def.searchable}
        />
      )}

      {def.editor === 'multiselect' && (
        <MultiSelect
          label={def.label}
          options={optionsForField(def, profile)}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(v) => setDraft({ [def.key]: v })}
          searchable={def.searchable}
          exclusiveValue="any"
        />
      )}

      {def.editor === 'chips' && (
        <ChipGroup
          options={(def.options ?? []).map((o) => ({ value: o.value, label: o.label }))}
          value={String(value ?? '')}
          onChange={(v) => setDraft({ [def.key]: v })}
        />
      )}

      {def.editor === 'bool' && (
        <ChipGroup
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
          value={String(value ?? 'no')}
          onChange={(v) => setDraft({ [def.key]: v })}
        />
      )}

      {def.editor === 'textarea' && (
        <>
          <textarea
            className="textarea-field"
            value={String(value ?? '')}
            maxLength={600}
            onChange={(e) => setDraft({ [def.key]: e.target.value })}
          />
          <p className="textarea-count">{String(value ?? '').length} / 600</p>
        </>
      )}

      {def.editor === 'height' && (
        <div className="flex gap-3">
          <SelectDropdown
            label="Feet"
            placeholder=""
            options={HEIGHT_FEET_OPTIONS} selectedFirst={false}
            value={draft.heightFeet}
            onChange={(v) => setDraft({ ...draft, heightFeet: v })}
            className="w-28"
          />
          <SelectDropdown
            label="Inches"
            placeholder=""
            options={HEIGHT_INCH_OPTIONS} selectedFirst={false}
            value={draft.heightInches}
            onChange={(v) => setDraft({ ...draft, heightInches: v })}
            className="w-28"
          />
        </div>
      )}

      {def.editor === 'date' && (
        <BirthDateTimePicker
          value={String(value ?? '')}
          onChange={(v) => setDraft({ [def.key]: v })}
        />
      )}

      {error && <p className="error-text mt-2">{error}</p>}
    </div>
  )
}
