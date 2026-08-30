'use client'

import React from 'react'
import { SelectDropdown, TextField } from '@lokesh-workspace/ui'

import { RELIGION_OPTIONS } from '@/lib/profileDisplay'
import { COUNTRY_OPTIONS } from '@/constants/selectOptions/places'
import { ANY_OPTION, PARTNER_AGE_OPTIONS, PARTNER_MARITAL_OPTIONS } from '@/constants/selectOptions/partner'

export interface MatchFilters {
  /** Free text across name, city, profession and community. */
  query: string
  ageMin: string
  ageMax: string
  religion: string
  maritalStatus: string
  country: string
}

export const EMPTY_FILTERS: MatchFilters = {
  query: '',
  ageMin: '',
  ageMax: '',
  religion: '',
  maritalStatus: '',
  country: '',
}

/** Human labels for the active-filter chips, so a chip reads "Religion: Hindu". */
const FILTER_LABELS: Record<keyof MatchFilters, string> = {
  query: 'Search',
  ageMin: 'Age from',
  ageMax: 'Age to',
  religion: 'Religion',
  maritalStatus: 'Marital status',
  country: 'Country',
}

const withAny = (options: { value: string; label: string }[]) => [ANY_OPTION, ...options]

interface MatchSearchBarProps {
  filters: MatchFilters
  onChange: (filters: MatchFilters) => void
  /** Shown beside the heading so the effect of a filter is immediately visible. */
  resultCount: number
  totalCount: number
}

export default function MatchSearchBar({
  filters,
  onChange,
  resultCount,
  totalCount,
}: MatchSearchBarProps) {
  const set = <K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) =>
    onChange({ ...filters, [key]: value })

  // 'any' is the dropdowns' way of saying "no preference"; it is stored as an
  // empty string so every filter has one falsy "unset" value to test against.
  const setChoice = (key: keyof MatchFilters, value: string) =>
    set(key, value === ANY_OPTION.value ? '' : value)

  const active = (Object.keys(filters) as (keyof MatchFilters)[]).filter((key) => filters[key])

  return (
    <section className="match-search" aria-label="Search matches">
      <div className="match-search-head">
        <div>
          <h2 className="match-search-title">Find your match</h2>
          <p className="match-search-count">
            {resultCount === totalCount
              ? `${totalCount} ${totalCount === 1 ? 'profile' : 'profiles'}`
              : `${resultCount} of ${totalCount} profiles`}
          </p>
        </div>
        {active.length > 0 && (
          <button type="button" className="chip chip-square" onClick={() => onChange(EMPTY_FILTERS)}>
            Clear all
          </button>
        )}
      </div>

      <div className="match-search-grid">
        <div className="match-search-query">
          <TextField
            id="match-query"
            label="Name, city or profession"
            value={filters.query}
            onChange={(e) => set('query', e.target.value)}
          />
        </div>

        <SelectDropdown
          id="match-age-min"
          label="Age from"
          placeholder=""
          options={withAny(PARTNER_AGE_OPTIONS)}
          value={filters.ageMin || ANY_OPTION.value}
          onChange={(v) => setChoice('ageMin', v)}
        />
        <SelectDropdown
          id="match-age-max"
          label="Age to"
          placeholder=""
          options={withAny(PARTNER_AGE_OPTIONS)}
          value={filters.ageMax || ANY_OPTION.value}
          onChange={(v) => setChoice('ageMax', v)}
        />
        <SelectDropdown
          id="match-religion"
          label="Religion"
          placeholder=""
          options={withAny(RELIGION_OPTIONS)}
          value={filters.religion || ANY_OPTION.value}
          onChange={(v) => setChoice('religion', v)}
        />
        <SelectDropdown
          id="match-marital"
          label="Marital status"
          placeholder=""
          options={PARTNER_MARITAL_OPTIONS}
          value={filters.maritalStatus || ANY_OPTION.value}
          onChange={(v) => setChoice('maritalStatus', v)}
        />
        <SelectDropdown
          id="match-country"
          label="Country"
          placeholder=""
          options={withAny(COUNTRY_OPTIONS)}
          value={filters.country || ANY_OPTION.value}
          onChange={(v) => setChoice('country', v)}
          searchable
        />
      </div>

      {active.length > 0 && (
        <div className="match-search-chips">
          {active.map((key) => (
            <button
              key={key}
              type="button"
              className="match-filter-chip"
              onClick={() => set(key, '')}
              aria-label={`Remove ${FILTER_LABELS[key]} filter`}
            >
              <span className="match-filter-chip-key">{FILTER_LABELS[key]}</span>
              {filters[key]}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
