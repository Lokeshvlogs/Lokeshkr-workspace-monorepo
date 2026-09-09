'use client'
import { Building2 } from 'lucide-react'

import React, { useEffect, useRef, useState } from 'react'
import { SelectDropdown, TextField } from '@lokesh-workspace/ui'

import { searchEmployers, toOptions, type SelectOptionLike } from '@/lib/catalog'

export const OTHER_EMPLOYER = 'other'

interface Props {
  /** Catalog slug, or OTHER_EMPLOYER. */
  slug: string
  name: string
  onChange: (slug: string, name: string) => void
  /** Narrows the list to employers that hire for this profession. */
  profession?: string
  country?: string
  disabled?: boolean
}

const DEBOUNCE_MS = 250

/**
 * Employer search, narrowed by profession and country.
 *
 * The employer is what a work-email check will later verify against - the
 * catalog carries each company's email domains for exactly that - so picking
 * from the list is worth more than typing a name, and the list is offered first.
 */
export default function EmployerPicker({
  slug,
  name,
  onChange,
  profession,
  country,
  disabled,
}: Props) {
  const [options, setOptions] = useState<SelectOptionLike[]>([])
  const [loading, setLoading] = useState(false)
  const [term, setTerm] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      // Cancel the in-flight request rather than racing it: a slow early
      // keystroke landing after a fast later one would repopulate the list with
      // results for a term already typed past.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      searchEmployers(term, country, profession, controller.signal)
        .then((page) => {
          if (!controller.signal.aborted) setOptions(toOptions(page.results))
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [term, country, profession])

  useEffect(() => () => abortRef.current?.abort(), [])

  const isOther = slug === OTHER_EMPLOYER

  // A saved employer must appear as an option or the field renders blank until
  // the member searches for it again.
  const withCurrent: SelectOptionLike[] = (() => {
    const list = [...options]
    if (slug && !isOther && !list.some((o) => o.value === slug)) {
      list.unshift({ value: slug, label: name || slug })
    }
    return [...list, { value: OTHER_EMPLOYER, label: 'Other / not listed' }]
  })()

  return (
    <div className="flex flex-col gap-4">
      <SelectDropdown
        label="Employer"
        icon={<Building2 />}
        placeholder=""
        options={withCurrent}
        value={slug}
        onChange={(next) => {
          const picked = withCurrent.find((o) => o.value === next)
          onChange(next, next === OTHER_EMPLOYER ? name : (picked?.label ?? ''))
        }}
        searchable
        onSearchChange={setTerm}
        loading={loading}
        disabled={disabled}
        emptyText="No match — choose “Other / not listed”"
        // The catalog ranks the results already; pinning the current pick on
        // top would fight that ordering.
        selectedFirst={false}
      />

      {isOther && (
        <TextField
          id="employer-name"
          label="Employer name"
          icon={<Building2 />}
          value={name}
          onChange={(e) => onChange(OTHER_EMPLOYER, e.target.value)}
        />
      )}
    </div>
  )
}
