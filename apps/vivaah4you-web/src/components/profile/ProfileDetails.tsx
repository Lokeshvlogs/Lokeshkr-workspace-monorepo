'use client'

import React from 'react'

import EditableField, { displayValue } from '@/components/profile/EditableField'
import FieldRow from '@/components/profile/FieldRow'
import { fieldsBySection, spansRow, type ProfileFieldDef } from '@/lib/profileFields'
import EducationTimeline from '@/components/profile/EducationTimeline'
import { educationTimeline } from '@/lib/educationTimeline'
import { SECTION_ICONS } from '@/lib/profileIcons'
import type { PublicProfile, SaveField } from '@/types/profile'

interface Props {
  profile: PublicProfile
  /** Enables the inline pencil editors. Owner-only. */
  editable?: boolean
  /** Required when editable. Resolves false if the save failed. */
  onSave?: SaveField
  /**
   * Section columns. Two suits a full-width page; the dashboard's centre
   * column is too narrow for two once each row carries an icon.
   */
  columns?: 1 | 2
}

/**
 * Sections that lead with something richer than field rows.
 *
 * A map rather than a conditional in the JSX, so adding one is a line here and
 * `page.tsx` / `MyProfileView` never learn about it.
 */
const SECTION_EXTRAS: Record<
  string,
  {
    Component: React.ComponentType<{ profile: PublicProfile }>
    /** Whether it would render anything for this profile. */
    hasContent: (profile: PublicProfile) => boolean
  }
> = {
  'Education & Career': {
    Component: EducationTimeline,
    hasContent: (profile) => educationTimeline(profile).length > 0,
  },
}

export default function ProfileDetails({
  profile,
  editable = false,
  onSave,
  columns = 2,
}: Props) {
  // `owner` gates the rows a visitor has no business reading because a hero tag
  // already says it, but which the owner still needs an editor for.
  const sections = fieldsBySection({ owner: editable })
    .map((section) => ({
      ...section,
      // Read-only viewers should not see rows the member never filled in;
      // the owner does, so there is something to click the pencil on.
      fields: editable
        ? section.fields
        : section.fields.filter((def) => displayValue(def, profile) !== ''),
    }))
    // A section with no rows left still earns its place if its extra has
    // something to show - a member whose only career answer is their education
    // would otherwise lose the timeline along with the empty rows.
    .filter(
      (section) =>
        section.fields.length > 0 ||
        Boolean(SECTION_EXTRAS[section.title]?.hasContent(profile)),
    )

  if (sections.length === 0) {
    return (
      <p className="text-sm text-color-placeholder-text">
        This profile has not been filled in yet.
      </p>
    )
  }

  const renderRow = (def: ProfileFieldDef) => {
    // Whether this field can share a row with its neighbour, or needs the whole
    // width of the panel. See `spansRow` for the two things that force it.
    const wide = spansRow(def)

    // Derived values have no pencil even for the owner: the wizard step that
    // produces them would overwrite an inline edit on its next save.
    if (editable && onSave && def.editor !== 'readonly') {
      return (
        <EditableField key={def.key} def={def} profile={profile} onSave={onSave} wide={wide} />
      )
    }
    return (
      <FieldRow
        key={def.key}
        fieldKey={def.key}
        label={def.label}
        value={displayValue(def, profile)}
        wide={wide}
      />
    )
  }

  return (
    /* `items-start`: the grid stretched every card to the tallest in its row,
       so a three-field Location card was padded out to match Partner
       Preference beside it. */
    <div
      className={`grid grid-cols-1 items-start gap-5 ${columns === 2 ? 'md:grid-cols-2' : ''}`}
    >
      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.title]
        const Extra = SECTION_EXTRAS[section.title]?.Component

        return (
          <section key={section.title} className="form-section">
            <h3 className="form-section-title">
              {Icon && <Icon className="form-section-icon" strokeWidth={1.8} aria-hidden="true" />}
              {section.title}
            </h3>
            {Extra && <Extra profile={profile} />}
            <dl className="field-list mt-2">{section.fields.map(renderRow)}</dl>
          </section>
        )
      })}
    </div>
  )
}
