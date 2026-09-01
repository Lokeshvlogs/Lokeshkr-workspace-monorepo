'use client'

import React, { useId, useState } from 'react'
import { SelectDropdown } from '@lokesh-workspace/ui'

import { communitiesFor } from '@/lib/profileDisplay'
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

export interface MatchFilters {
  /* --- always visible --- */
  /** Free text across name, city, profession and community. */
  query: string
  ageMin: string
  ageMax: string
  religion: string
  /* --- behind "Advanced" --- */
  maritalStatus: string
  country: string
  motherTongue: string
  community: string
  education: string
  profession: string
  diet: string
  heightMin: string
  heightMax: string
}

export const EMPTY_FILTERS: MatchFilters = {
  query: '',
  ageMin: '',
  ageMax: '',
  religion: '',
  maritalStatus: '',
  country: '',
  motherTongue: '',
  community: '',
  education: '',
  profession: '',
  diet: '',
  heightMin: '',
  heightMax: '',
}

/** Which keys live in the expandable panel - drives the "N applied" badge. */
const ADVANCED_KEYS: (keyof MatchFilters)[] = [
  'maritalStatus',
  'country',
  'motherTongue',
  'community',
  'education',
  'profession',
  'diet',
  'heightMin',
  'heightMax',
]

const FILTER_LABELS: Record<keyof MatchFilters, string> = {
  query: 'Search',
  ageMin: 'Age from',
  ageMax: 'Age to',
  religion: 'Religion',
  maritalStatus: 'Marital status',
  country: 'Country',
  motherTongue: 'Mother tongue',
  community: 'Community',
  education: 'Education',
  profession: 'Profession',
  diet: 'Diet',
  heightMin: 'Height from',
  heightMax: 'Height to',
}

export type SortKey = 'best' | 'newest' | 'age_asc' | 'age_desc'

const SORT_OPTIONS = [
  { value: 'best', label: 'Best match' },
  { value: 'newest', label: 'Recently joined' },
  { value: 'age_asc', label: 'Age: low to high' },
  { value: 'age_desc', label: 'Age: high to low' },
]

interface MatchSearchBarProps {
  filters: MatchFilters
  onChange: (filters: MatchFilters) => void
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  resultCount: number
  totalCount: number
}

export default function MatchSearchBar({
  filters,
  onChange,
  sort,
  onSortChange,
  resultCount,
  totalCount,
}: MatchSearchBarProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  const set = <K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) =>
    onChange({ ...filters, [key]: value })

  // 'any' is how the dropdowns say "no preference"; store it as '' so every
  // filter has a single falsy "unset" value to test against.
  const setChoice = (key: keyof MatchFilters, value: string) =>
    set(key, value === ANY_OPTION.value ? '' : value)

  const active = (Object.keys(filters) as (keyof MatchFilters)[]).filter((key) => filters[key])
  const advancedCount = ADVANCED_KEYS.filter((key) => filters[key]).length

  // Community only makes sense once a religion narrows it; without one the list
  // would be every caste in the data set.
  const communityOptions = filters.religion
    ? withAny(communitiesFor(filters.religion))
    : [ANY_OPTION]

  const choice = (key: keyof MatchFilters) => filters[key] || ANY_OPTION.value

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
            onChange={(e) => set('query', e.target.value)}
            aria-label="Search by name, city or profession"
          />
        </div>

        <div className="search-bar-compact">
          <SelectDropdown
            id="match-age-min"
            label="Age from"
            placeholder=""
            options={withAny(PARTNER_AGE_OPTIONS)}
            value={choice('ageMin')}
            onChange={(v) => setChoice('ageMin', v)}
          />
          <SelectDropdown
            id="match-age-max"
            label="Age to"
            placeholder=""
            options={withAny(PARTNER_AGE_OPTIONS)}
            value={choice('ageMax')}
            onChange={(v) => setChoice('ageMax', v)}
          />
          <SelectDropdown
            id="match-religion"
            label="Religion"
            placeholder=""
            options={PARTNER_RELIGION_OPTIONS}
            value={choice('religion')}
            onChange={(v) => setChoice('religion', v)}
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
            <SelectDropdown id="f-marital" label="Marital status" placeholder="" options={PARTNER_MARITAL_OPTIONS} value={choice('maritalStatus')} onChange={(v) => setChoice('maritalStatus', v)} />
            <SelectDropdown id="f-country" label="Country" placeholder="" options={PARTNER_COUNTRY_OPTIONS} value={choice('country')} onChange={(v) => setChoice('country', v)} searchable />
            <SelectDropdown id="f-tongue" label="Mother tongue" placeholder="" options={PARTNER_MOTHER_TONGUE_OPTIONS} value={choice('motherTongue')} onChange={(v) => setChoice('motherTongue', v)} searchable />
            <SelectDropdown
              id="f-community"
              label={filters.religion ? 'Community' : 'Community (pick a religion first)'}
              placeholder=""
              options={communityOptions}
              value={choice('community')}
              onChange={(v) => setChoice('community', v)}
              searchable
              disabled={!filters.religion}
            />
            <SelectDropdown id="f-education" label="Education" placeholder="" options={PARTNER_EDUCATION_OPTIONS} value={choice('education')} onChange={(v) => setChoice('education', v)} searchable />
            <SelectDropdown id="f-profession" label="Profession" placeholder="" options={PARTNER_PROFESSION_OPTIONS} value={choice('profession')} onChange={(v) => setChoice('profession', v)} searchable />
            <SelectDropdown id="f-diet" label="Diet" placeholder="" options={PARTNER_DIET_OPTIONS} value={choice('diet')} onChange={(v) => setChoice('diet', v)} />
            <SelectDropdown id="f-height-min" label="Height from" placeholder="" options={withAny(PARTNER_HEIGHT_OPTIONS)} value={choice('heightMin')} onChange={(v) => setChoice('heightMin', v)} />
            <SelectDropdown id="f-height-max" label="Height to" placeholder="" options={withAny(PARTNER_HEIGHT_OPTIONS)} value={choice('heightMax')} onChange={(v) => setChoice('heightMax', v)} />
          </div>
        </div>
      )}

      <div className="search-summary">
        <p className="search-summary-count">
          <strong>{resultCount}</strong>
          {resultCount === totalCount ? ' profiles' : ` of ${totalCount} profiles`}
        </p>

        {active.length > 0 && (
          <div className="search-chips">
            {active.map((key) => (
              <button
                key={key}
                type="button"
                className="search-chip"
                onClick={() => set(key, '')}
                aria-label={`Remove ${FILTER_LABELS[key]} filter`}
              >
                <span className="search-chip-key">{FILTER_LABELS[key]}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
            <button type="button" className="search-chip-clear" onClick={() => onChange(EMPTY_FILTERS)}>
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
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
