'use client'
import { BookOpen, CalendarDays, Globe2, GraduationCap } from 'lucide-react'

import React, { useState } from 'react'
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
export const isSchool = (level: string) => SCHOOL_LEVELS.has(level)

/**
 * Whether a row has every part the wizard insists on before the step will
 * advance. Lives here rather than in the wizard because only this file knows
 * which inputs a given level actually renders.
 */
export const isEducationComplete = (entry: EducationEntry): boolean =>
  entry.level !== '' &&
  entry.country !== '' &&
  entry.institutionSlug !== '' &&
  entry.institutionName.trim() !== '' &&
  // A school row never offers field of study, so requiring it would be
  // unsatisfiable.
  (isSchool(entry.level) || entry.fieldOfStudy !== '')

interface Props {
  value: EducationEntry[]
  onChange: (entries: EducationEntry[]) => void
  /**
   * Set once the wizard has been asked to advance without a usable row. Every
   * incomplete row is outlined and each of its unanswered inputs marked, so the
   * member can see which part is missing rather than just that something is.
   */
  error?: string
}

export default function EducationList({ value, onChange, error }: Props) {
  const entries = value.length ? value : [emptyEducation()]

  const update = (index: number, patch: Partial<EducationEntry>) => {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  const remove = (index: number) => {
    const next = entries.filter((_, i) => i !== index)
    onChange(next.length ? next : [emptyEducation()])
  }

  // With one row it is obviously the one at fault. With several, marking the
  // complete ones too would send the member back into rows that are fine.
  const flag = (entry: EducationEntry) => Boolean(error) && !isEducationComplete(entry)

  /* Tracked here rather than by the wizard: these inputs are per row, so their
     keys only mean anything alongside the row index this component owns. */
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set())
  const touch = (index: number, field: string) => () =>
    setTouched((prev) => {
      const key = `${index}:${field}`
      return prev.has(key) ? prev : new Set(prev).add(key)
    })

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="error-text" role="alert">{error}</p>}
      {entries.map((entry, index) => {
        const school = isSchool(entry.level)
        const other = entry.institutionSlug === OTHER_INSTITUTION
        const bad = flag(entry)
        // Marked once the whole row is flagged, or once this one input has been
        // left empty on its way past.
        const req = (field: string, ok: boolean) =>
          !ok && (bad || touched.has(`${index}:${field}`)) ? 'Required' : undefined

        return (
          <div key={index} className={`education-card ${bad ? 'education-card-error' : ''}`}>
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
                icon={<GraduationCap />}
                errorValue={req('level', entry.level !== '')}
                onBlur={touch(index, 'level')}
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
                icon={<Globe2 />}
                errorValue={req('country', entry.country !== '')}
                onBlur={touch(index, 'country')}
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
                errorValue={req('institutionSlug', entry.institutionSlug !== '')}
                onBlur={touch(index, 'institutionSlug')}
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
                    errorValue={req('institutionName', entry.institutionName.trim() !== '')}
                    onBlur={touch(index, 'institutionName')}
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
                    icon={<BookOpen />}
                    errorValue={req('fieldOfStudy', entry.fieldOfStudy !== '')}
                    onBlur={touch(index, 'fieldOfStudy')}
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
                  icon={<CalendarDays />}
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
