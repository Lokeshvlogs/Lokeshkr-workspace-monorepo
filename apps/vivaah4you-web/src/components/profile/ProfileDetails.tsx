'use client'

import React from 'react'

import EditableField, { displayValue } from '@/components/profile/EditableField'
import FieldRow from '@/components/profile/FieldRow'
import { fieldsBySection, type ProfileFieldDef } from '@/lib/profileFields'
import type { PublicProfile } from '@/types/profile'

interface Props {
  profile: PublicProfile
  /** Enables the inline pencil editors. Owner-only. */
  editable?: boolean
  /** Required when editable. Resolves false if the save failed. */
  onSave?: (step: number, patch: Record<string, unknown>) => Promise<boolean>
  /**
   * Section columns. Two suits a full-width page; the dashboard's centre
   * column is too narrow for two once each row carries an icon.
   */
  columns?: 1 | 2
}

export default function ProfileDetails({
  profile,
  editable = false,
  onSave,
  columns = 2,
}: Props) {
  const sections = fieldsBySection()
    .map((section) => ({
      ...section,
      // Read-only viewers should not see rows the member never filled in;
      // the owner does, so there is something to click the pencil on.
      fields: editable
        ? section.fields
        : section.fields.filter((def) => displayValue(def, profile) !== ''),
    }))
    .filter((section) => section.fields.length > 0)

  if (sections.length === 0) {
    return (
      <p className="text-sm text-color-placeholder-text">
        This profile has not been filled in yet.
      </p>
    )
  }

  const renderRow = (def: ProfileFieldDef) => {
    // Derived values have no pencil even for the owner: the wizard step that
    // produces them would overwrite an inline edit on its next save.
    if (editable && onSave && def.editor !== 'readonly') {
      return <EditableField key={def.key} def={def} profile={profile} onSave={onSave} />
    }
    return (
      <FieldRow
        key={def.key}
        fieldKey={def.key}
        label={def.label}
        value={displayValue(def, profile)}
      />
    )
  }

  return (
    <div className={`grid grid-cols-1 gap-5 ${columns === 2 ? 'md:grid-cols-2' : ''}`}>
      {sections.map((section) => (
        <section key={section.title} className="form-section">
          <h3 className="form-section-title">{section.title}</h3>
          <dl className="mt-2">{section.fields.map(renderRow)}</dl>
        </section>
      ))}
    </div>
  )
}
