'use client'

import React, { useState } from 'react'
import {
  ChipGroup,
  DatePicker,
  RangeSlider,
  SelectDropdown,
  TextField,
  TimePicker,
} from '@lokesh-workspace/ui'

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
    case 'wantsChildren':
      return profile.wantsChildren ? 'Yes' : 'No'
    case 'exercise':
    case 'religiousness':
    case 'astrologyBelief': {
      const value = Number((profile as any)[def.key] ?? 0)
      const captions = def.captions
      if (!captions?.length) return String(value)
      const span = (def.max ?? 10) - (def.min ?? 0) || 1
      return captions[Math.min(captions.length - 1, Math.round((value / span) * (captions.length - 1)))]
    }
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
      <div className="group flex items-start justify-between gap-3 py-1.5 text-sm">
        <dt className="shrink-0 pt-0.5 text-color-placeholder-text">{def.label}</dt>
        <dd className="flex min-w-0 items-start gap-2 text-right">
          <span className={`font-medium ${shown ? 'text-gray-900' : 'text-color-placeholder-text italic'}`}>
            {shown || 'Not added'}
          </span>
          <button
            type="button"
            onClick={beginEdit}
            aria-label={`Edit ${def.label}`}
            title={`Edit ${def.label}`}
            className="field-edit-btn"
          >
            <PencilIcon />
          </button>
        </dd>
      </div>
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
          LabelX={-2}
          LabelY={-20}
          PlaceHolderX={2}
          PlaceHolderY={2}
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

      {def.editor === 'range' && (
        <RangeSlider
          label={def.label}
          value={Number(value ?? 0)}
          min={def.min ?? 0}
          max={def.max ?? 10}
          captions={def.captions}
          onChange={(v) => setDraft({ [def.key]: v })}
        />
      )}

      {def.editor === 'height' && (
        <div className="flex gap-3">
          <SelectDropdown
            label="Feet"
            placeholder=""
            options={HEIGHT_FEET_OPTIONS}
            value={draft.heightFeet}
            onChange={(v) => setDraft({ ...draft, heightFeet: v })}
            className="w-28"
            LabelX={-2}
            LabelY={-20}
          />
          <SelectDropdown
            label="Inches"
            placeholder=""
            options={HEIGHT_INCH_OPTIONS}
            value={draft.heightInches}
            onChange={(v) => setDraft({ ...draft, heightInches: v })}
            className="w-28"
            LabelX={-2}
            LabelY={-20}
          />
        </div>
      )}

      {/* Date and time stay on one row; the panel scrolls rather than wrapping. */}
      {def.editor === 'date' && (
        <div className="flex flex-nowrap items-end gap-4 overflow-x-auto pb-1">
          <div className="shrink-0">
            <span className="mb-1 block text-xs font-medium text-color-placeholder-text">Date of birth</span>
            <DatePicker
              value={String(value ?? '').split('T')[0]}
              onDateChange={(y, m, d) => {
                if (!y || !m || !d) return
                const time = String(value ?? '').split('T')[1]?.slice(0, 5)
                setDraft({ [def.key]: time ? `${y}-${m}-${d}T${time}` : `${y}-${m}-${d}` })
              }}
            />
          </div>
          <div className="mb-2 hidden h-8 w-px shrink-0 bg-color-border sm:block" />
          <div className="shrink-0">
            <span className="mb-1 block text-xs font-medium text-color-placeholder-text">Time of birth</span>
            <TimePicker
              value={String(value ?? '').split('T')[1]?.slice(0, 5) ?? ''}
              onChange={(t) => {
                const date = String(value ?? '').split('T')[0]
                if (date) setDraft({ [def.key]: `${date}T${t}` })
              }}
              inputClassName="p-3 w-12"
            />
          </div>
        </div>
      )}

      {error && <p className="error-text mt-2">{error}</p>}
    </div>
  )
}
