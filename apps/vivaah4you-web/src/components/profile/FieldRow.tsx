'use client'

import React, { type ReactNode } from 'react'

import { iconFor } from '@/lib/profileIcons'

interface Props {
  /** Field key, used to look up the icon. */
  fieldKey: string
  label: string
  /** Formatted value, or '' when the member has not answered. */
  value: string
  /** Placeholder shown when `value` is empty. Owner-only views pass one. */
  emptyText?: string
  /** Trailing control, e.g. the edit pencil. */
  action?: ReactNode
}

/**
 * One field of a profile, shown as icon + value rather than label + value.
 *
 * The label is never dropped, only hidden: it stays in the <dt> as screen
 * reader text so the surrounding <dl> is still a real term/definition list and
 * announces "Education: Master's degree". `title` on the row is a mouse
 * affordance on top of that, never the accessible name - it is unreliably
 * announced and invisible on touch.
 *
 * Fields with no registered icon keep their visible label. A value with no
 * label of any kind is never rendered.
 *
 * Shared by the read-only and editable views so the two cannot drift apart.
 */
export default function FieldRow({ fieldKey, label, value, emptyText, action }: Props) {
  const Icon = iconFor(fieldKey)
  const shown = value || emptyText || ''

  return (
    <div className="field-row" title={Icon ? label : undefined}>
      {Icon ? (
        <>
          <Icon className="field-icon" strokeWidth={1.6} aria-hidden="true" />
          <dt className="sr-only">{label}</dt>
        </>
      ) : (
        <dt className="field-label-text">{label}</dt>
      )}

      <dd className={`field-value ${value ? '' : 'field-value-empty'}`}>{shown}</dd>

      {action}
    </div>
  )
}
