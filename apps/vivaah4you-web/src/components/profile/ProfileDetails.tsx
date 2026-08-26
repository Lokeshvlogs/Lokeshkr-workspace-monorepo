'use client'

import React from 'react'

import EditableField, { displayValue } from '@/components/profile/EditableField'
import { fieldsBySection, type ProfileFieldDef } from '@/lib/profileFields'
import type { PublicProfile } from '@/types/profile'

interface Props {
  profile: PublicProfile
  /** Enables the inline pencil editors. Owner-only. */
  editable?: boolean
  /** Required when editable. Resolves false if the save failed. */
  onSave?: (step: number, patch: Record<string, unknown>) => Promise<boolean>
}

export default function ProfileDetails({ profile, editable = false, onSave }: Props) {
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
    if (editable && onSave) {
      return <EditableField key={def.key} def={def} profile={profile} onSave={onSave} />
    }
    return (
      <div key={def.key} className="flex justify-between gap-4 py-1.5 text-sm">
        <dt className="shrink-0 text-color-placeholder-text">{def.label}</dt>
        <dd className="text-right font-medium text-gray-900">{displayValue(def, profile)}</dd>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {sections.map((section) => (
        <section key={section.title} className="form-section">
          <h3 className="form-section-title">{section.title}</h3>
          <dl className="mt-2 divide-y divide-pink-50">{section.fields.map(renderRow)}</dl>
        </section>
      ))}
    </div>
  )
}
