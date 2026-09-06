'use client'

import React from 'react'
import { TextField } from '@lokesh-workspace/ui'

export interface AchievementEntry {
  title: string
  year: string
  detail: string
}

export const MAX_ACHIEVEMENTS = 10

export const emptyAchievement = (): AchievementEntry => ({ title: '', year: '', detail: '' })

interface Props {
  value: AchievementEntry[]
  onChange: (entries: AchievementEntry[]) => void
}

/**
 * Awards, publications, competitive ranks - anything a member is proud of.
 *
 * Entirely optional, and starts collapsed to a single Add button rather than an
 * empty row: most members have nothing to put here, and an empty form field
 * reads as something left undone.
 */
export default function AchievementList({ value, onChange }: Props) {
  const update = (index: number, patch: Partial<AchievementEntry>) => {
    onChange(value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((entry, index) => (
        <div key={index} className="achievement-row">
          <div className="form-grid-2">
            <TextField
              id={`ach-title-${index}`}
              label="Achievement"
              value={entry.title}
              onChange={(e) => update(index, { title: e.target.value })}
            />
            <TextField
              id={`ach-year-${index}`}
              label="Year"
              type="number"
              inputMode="numeric"
              value={entry.year}
              onChange={(e) => update(index, { year: e.target.value })}
            />
          </div>

          <div className="mt-3 flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <TextField
                id={`ach-detail-${index}`}
                label="A little more (optional)"
                value={entry.detail}
                onChange={(e) => update(index, { detail: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="education-remove shrink-0"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              aria-label={`Remove achievement ${index + 1}`}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="education-add"
        disabled={value.length >= MAX_ACHIEVEMENTS}
        onClick={() => onChange([...value, emptyAchievement()])}
      >
        {value.length === 0 ? '+ Add an achievement' : '+ Add another'}
      </button>
    </div>
  )
}
