'use client'

import React, { useId, useState } from 'react'
import { MultiSelect, SelectDropdown } from '@lokesh-workspace/ui'

import { communitiesFor } from '@/lib/profileDisplay'
import {
  FILTER_LABELS,
  MULTI_KEYS,
  SCALAR_KEYS,
  chipValue,
  emptyFilters,
  type MatchFilters,
  type MultiKey,
  type ScalarKey,
} from '@/lib/matchFilters'
import {
  ANY_OPTION,
  PARTNER_AGE_OPTIONS,
  PARTNER_COUNTRY_OPTIONS,
  PARTNER_DIET_OPTIONS,
  PARTNER_EDUCATION_OPTIONS,
  PARTNER_HEIGHT_OPTIONS,
  PARTNER_MARITAL_OPTIONS,
  PARTNER_MOTHER_TONGUE_OPTIONS,
  PARTNER_PROFESSION_OPTIONS,
  PARTNER_RELIGION_OPTIONS,
  withAny,
} from '@/constants/selectOptions/partner'
import { familyIncomeOptions } from '@/constants/selectOptions/people'

export type SortKey = 'best' | 'newest' | 'age_asc' | 'age_desc'

const SORT_OPTIONS = [
  { value: 'best', label: 'Best match' },
  { value: 'newest', label: 'Recently joined' },
  { value: 'age_asc', label: 'Age: low to high' },
  { value: 'age_desc', label: 'Age: high to low' },
]

const NRI_OPTIONS = [
  ANY_OPTION,
  { value: '1', label: 'Living abroad' },
  { value: '0', label: 'In India' },
]

/** Which keys live in the expandable panel - drives the "N applied" badge. */
const ADVANCED_KEYS: (ScalarKey | MultiKey)[] = [
  'maritalStatus',
  'country',
  'motherTongue',
  'community',
  'education',
  'profession',
  'diet',
  'salary',
  'citizenship',
  'nri',
  'heightMin',
  'heightMax',
]

interface MatchSearchBarProps {
  filters: MatchFilters
  onChange: (filters: MatchFilters) => void
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  /** How many profiles the server matched. */
  resultCount: number
}

export default function MatchSearchBar({
  filters,
  onChange,
  sort,
  onSortChange,
  resultCount,
}: MatchSearchBarProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  const setScalar = (key: ScalarKey, value: string) => onChange({ ...filters, [key]: value })
  const setMulti = (key: MultiKey, values: string[]) => onChange({ ...filters, [key]: values })

  // 'any' is how a dropdown says "no preference"; store it as '' so every
  // scalar filter has a single falsy "unset" value to test against.
  const setChoice = (key: ScalarKey, value: string) =>
    setScalar(key, value === ANY_OPTION.value ? '' : value)

  const isMulti = (key: string) => (MULTI_KEYS as readonly string[]).includes(key)

  /**
   * One entry per VALUE, not per field.
   *
   * Filters used to be single-valued, so a chip per field was the same thing.
   * Now that a search can arrive seeded with eight of a member's saved
   * preferences, a chip reading only "Community" eight times would be useless -
   * each one has to name the value it removes.
   */
  const active: Array<{ key: ScalarKey | MultiKey; value: string }> = [
    ...SCALAR_KEYS.filter((key) => filters[key]).map((key) => ({
      key: key as ScalarKey | MultiKey,
      value: filters[key],
    })),
    ...MULTI_KEYS.flatMap((key) =>
      filters[key].map((value) => ({ key: key as ScalarKey | MultiKey, value })),
    ),
  ]

  const advancedCount = ADVANCED_KEYS.reduce(
    (total, key) =>
      total +
      (isMulti(key) ? filters[key as MultiKey].length : filters[key as ScalarKey] ? 1 : 0),
    0,
  )

  const remove = (key: ScalarKey | MultiKey, value: string) => {
    if (isMulti(key)) {
      setMulti(
        key as MultiKey,
        filters[key as MultiKey].filter((entry) => entry !== value),
      )
    } else {
      setScalar(key as ScalarKey, '')
    }
  }

  // Community only makes sense once a religion narrows it. With several chosen
  // it is the union of their lists, de-duplicated - a value can appear under
  // more than one religion.
  const communityOptions = filters.religion.length
    ? Array.from(
        new Map(
          filters.religion.flatMap((religion) => communitiesFor(religion)).map((o) => [o.value, o]),
        ).values(),
      )
    : []

  const choice = (key: ScalarKey) => filters[key] || ANY_OPTION.value

  return (
    <section className="search-panel" aria-label="Search matches">
      <div className="search-bar">
        <div className="search-bar-query">
          <svg className="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="match-query"
            type="search"
            className="search-bar-input"
            placeholder="Search profiles"
            value={filters.query}
            onChange={(e) => setScalar('query', e.target.value)}
            aria-label="Search by name, city or profession"
          />
        </div>

        <div className="search-bar-compact">
          <SelectDropdown
            id="match-age-min"
            label="Age from"
            placeholder=""
            options={withAny(PARTNER_AGE_OPTIONS)}
            selectedFirst={false}
            value={choice('ageMin')}
            onChange={(v) => setChoice('ageMin', v)}
          />
          <SelectDropdown
            id="match-age-max"
            label="Age to"
            placeholder=""
            options={withAny(PARTNER_AGE_OPTIONS)}
            selectedFirst={false}
            value={choice('ageMax')}
            onChange={(v) => setChoice('ageMax', v)}
          />
          <MultiSelect
            id="match-religion"
            label="Religion"
            options={PARTNER_RELIGION_OPTIONS.filter((o) => o.value !== ANY_OPTION.value)}
            value={filters.religion}
            onChange={(v) => setMulti('religion', v)}
          />
        </div>

        <button
          type="button"
          className={`search-advanced-toggle ${open ? 'search-advanced-toggle-open' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filters
          {advancedCount > 0 && <span className="search-advanced-badge">{advancedCount}</span>}
        </button>
      </div>

      {open && (
        <div id={panelId} className="search-advanced">
          <div className="search-advanced-grid">
            <MultiSelect id="f-marital" label="Marital status" options={PARTNER_MARITAL_OPTIONS.filter((o) => o.value !== ANY_OPTION.value)} value={filters.maritalStatus} onChange={(v) => setMulti('maritalStatus', v)} />
            <MultiSelect id="f-country" label="Country" options={PARTNER_COUNTRY_OPTIONS.filter((o) => o.value !== ANY_OPTION.value)} value={filters.country} onChange={(v) => setMulti('country', v)} searchable />
            <MultiSelect id="f-tongue" label="Mother tongue" options={PARTNER_MOTHER_TONGUE_OPTIONS.filter((o) => o.value !== ANY_OPTION.value)} value={filters.motherTongue} onChange={(v) => setMulti('motherTongue', v)} searchable />
            <MultiSelect
              id="f-community"
              label={filters.religion.length ? 'Community' : 'Community (pick a religion first)'}
              options={communityOptions}
              value={filters.community}
              onChange={(v) => setMulti('community', v)}
              searchable
              disabled={!filters.religion.length}
            />
            <MultiSelect id="f-education" label="Education" options={PARTNER_EDUCATION_OPTIONS.filter((o) => o.value !== ANY_OPTION.value)} value={filters.education} onChange={(v) => setMulti('education', v)} searchable />
            <MultiSelect id="f-profession" label="Profession" options={PARTNER_PROFESSION_OPTIONS.filter((o) => o.value !== ANY_OPTION.value)} value={filters.profession} onChange={(v) => setMulti('profession', v)} searchable />
            <MultiSelect id="f-diet" label="Diet" options={PARTNER_DIET_OPTIONS.filter((o) => o.value !== ANY_OPTION.value)} value={filters.diet} onChange={(v) => setMulti('diet', v)} />
            <MultiSelect id="f-salary" label="Annual income" options={familyIncomeOptions} value={filters.salary} onChange={(v) => setMulti('salary', v)} />
            <MultiSelect id="f-citizenship" label="Citizen of" options={PARTNER_COUNTRY_OPTIONS.filter((o) => o.value !== ANY_OPTION.value)} value={filters.citizenship} onChange={(v) => setMulti('citizenship', v)} searchable />
            <SelectDropdown id="f-nri" label="Based" placeholder="" options={NRI_OPTIONS} value={choice('nri')} onChange={(v) => setChoice('nri', v)} />
            <SelectDropdown id="f-height-min" label="Height from" placeholder="" options={withAny(PARTNER_HEIGHT_OPTIONS)} selectedFirst={false} value={choice('heightMin')} onChange={(v) => setChoice('heightMin', v)} />
            <SelectDropdown id="f-height-max" label="Height to" placeholder="" options={withAny(PARTNER_HEIGHT_OPTIONS)} selectedFirst={false} value={choice('heightMax')} onChange={(v) => setChoice('heightMax', v)} />
          </div>
        </div>
      )}

      <div className="search-summary">
        {/* One number, not "N of M". The server returns the filtered count, and
            there is no unfiltered total without a second query nobody reads. */}
        <p className="search-summary-count">
          <strong>{resultCount}</strong> {resultCount === 1 ? 'profile' : 'profiles'}
        </p>

        {active.length > 0 && (
          <div className="search-chips">
            {active.map(({ key, value }) => (
              <button
                key={`${key}:${value}`}
                type="button"
                className="search-chip"
                onClick={() => remove(key, value)}
                aria-label={`Remove ${FILTER_LABELS[key]} ${chipValue(key, value)} filter`}
              >
                <span className="search-chip-key">{FILTER_LABELS[key]}</span>
                {chipValue(key, value)}
                <span aria-hidden="true">×</span>
              </button>
            ))}
            <button type="button" className="search-chip-clear" onClick={() => onChange(emptyFilters())}>
              Clear all
            </button>
          </div>
        )}

        <label className="search-sort">
          <span className="search-sort-label">Sort</span>
          <select
            className="search-sort-select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
