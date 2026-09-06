'use client'

import React from 'react'
import { SelectDropdown, TextField } from '@lokesh-workspace/ui'

import InstitutionPicker, { OTHER_INSTITUTION } from '@/components/profile/InstitutionPicker'
import { educationOptions, fieldOfStudyOptions } from '@/constants/selectOptions/career'
import { COUNTRY_OPTIONS } from '@/constants/selectOptions/places'

export interface EducationEntry {
  level: string
  fieldOfStudy: string
  country: string
  institutionSlug: string
  institutionName: string
  isOther: boolean
  reputationClaimed: boolean
  completionYear: string
}

export const MAX_EDUCATIONS = 5

export const emptyEducation = (): EducationEntry => ({
  level: '',
  fieldOfStudy: '',
  country: '',
  institutionSlug: '',
  institutionName: '',
  isOther: false,
  reputationClaimed: false,
  completionYear: '',
})

/**
 * Levels at or below school. These record where someone studied but never a
 * reputation: schooling says little about a person and a lot about where their
 * parents could afford to live.
 */
const SCHOOL_LEVELS = new Set(['high_school'])

/** School rows also skip field of study - "10th, Science" is not a thing. */
const isSchool = (level: string) => SCHOOL_LEVELS.has(level)

interface Props {
  value: EducationEntry[]
  onChange: (entries: EducationEntry[]) => void
}

export default function EducationList({ value, onChange }: Props) {
  const entries = value.length ? value : [emptyEducation()]

  const update = (index: number, patch: Partial<EducationEntry>) => {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  const remove = (index: number) => {
    const next = entries.filter((_, i) => i !== index)
    onChange(next.length ? next : [emptyEducation()])
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry, index) => {
        const school = isSchool(entry.level)
        const other = entry.institutionSlug === OTHER_INSTITUTION

        return (
          <div key={index} className="education-card">
            <div className="education-card-head">
              <span className="education-card-index">
                {entry.level
                  ? educationOptions.find((o) => o.value === entry.level)?.label
                  : `Qualification ${index + 1}`}
              </span>
              {entries.length > 1 && (
                <button
                  type="button"
                  className="education-remove"
                  onClick={() => remove(index)}
                  aria-label={`Remove qualification ${index + 1}`}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="form-grid-2 mt-3">
              <SelectDropdown
                label="Level"
                placeholder=""
                options={educationOptions}
                value={entry.level}
                onChange={(v) =>
                  update(index, {
                    level: v,
                    // A school row cannot carry either of these, so drop
                    // anything already answered rather than saving it hidden.
                    ...(isSchool(v) ? { reputationClaimed: false, fieldOfStudy: '' } : {}),
                  })
                }
                // A level ladder: keeping it in order matters more than
                // surfacing the current pick.
                selectedFirst={false}
              />

              <SelectDropdown
                label="Country of study"
                placeholder=""
                options={COUNTRY_OPTIONS}
                value={entry.country}
                onChange={(v) =>
                  // The institution list is per country, so an institution
                  // chosen under the old one no longer belongs.
                  update(index, {
                    country: v,
                    institutionSlug: '',
                    institutionName: '',
                    isOther: false,
                    reputationClaimed: false,
                  })
                }
                searchable
              />
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <InstitutionPicker
                label={school ? 'School' : 'College / University'}
                value={entry.institutionSlug}
                valueName={entry.institutionName}
                onChange={(slug, name) =>
                  update(index, {
                    institutionSlug: slug,
                    institutionName: slug === OTHER_INSTITUTION ? entry.institutionName : name,
                    isOther: slug === OTHER_INSTITUTION,
                    ...(slug === OTHER_INSTITUTION ? {} : { reputationClaimed: false }),
                  })
                }
                country={entry.country}
                kind={school ? 'school' : undefined}
              />

              {other && (
                <>
                  <TextField
                    id={`inst-name-${index}`}
                    label={school ? 'School name' : 'Institution name'}
                    value={entry.institutionName}
                    onChange={(e) => update(index, { institutionName: e.target.value })}
                  />

                  {/* Hidden for school rows: there is nothing to claim, because
                      school reputation is never recorded or used. */}
                  {!school && (
                    <label className="education-claim">
                      <input
                        type="checkbox"
                        checked={entry.reputationClaimed}
                        onChange={(e) => update(index, { reputationClaimed: e.target.checked })}
                      />
                      <span>This is a well-regarded institution</span>
                    </label>
                  )}
                </>
              )}

              <div className="form-grid-2">
                {!school && (
                  <SelectDropdown
                    label="Field of study"
                    placeholder=""
                    options={fieldOfStudyOptions}
                    value={entry.fieldOfStudy}
                    onChange={(v) => update(index, { fieldOfStudy: v })}
                    searchable
                  />
                )}
                <TextField
                  id={`edu-year-${index}`}
                  label="Year completed"
                  type="number"
                  inputMode="numeric"
                  value={entry.completionYear}
                  onChange={(e) => update(index, { completionYear: e.target.value })}
                />
              </div>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        className="education-add"
        disabled={entries.length >= MAX_EDUCATIONS}
        onClick={() => onChange([...entries, emptyEducation()])}
      >
        + Add another qualification
        {entries.length >= MAX_EDUCATIONS && <span className="education-add-note">(max {MAX_EDUCATIONS})</span>}
      </button>
    </div>
  )
}
