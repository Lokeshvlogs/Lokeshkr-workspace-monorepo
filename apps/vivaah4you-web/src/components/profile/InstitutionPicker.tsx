'use client'

import React, { useEffect, useRef, useState } from 'react'
import { SelectDropdown } from '@lokesh-workspace/ui'

import { searchInstitutions, toOptions, type SelectOptionLike } from '@/lib/catalog'

/** Always last in the list, so there is a way out when the catalog falls short. */
export const OTHER_INSTITUTION = 'other'

interface Props {
  label: string
  /** Catalog slug, or OTHER_INSTITUTION. */
  value: string
  /** The stored name, so a saved pick still reads correctly before any search. */
  valueName?: string
  onChange: (slug: string, name: string) => void
  /** Narrows the search; changing it clears the results. */
  country?: string
  kind?: string
  disabled?: boolean
}

const DEBOUNCE_MS = 250

/**
 * Institution search backed by the catalog API.
 *
 * The list is far too large to ship to the browser and carries an internal
 * reputation tier that must not leave the server, so the search runs there and
 * only names come back.
 */
export default function InstitutionPicker({
  label,
  value,
  valueName,
  onChange,
  country,
  kind,
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
      // Supersede the previous request rather than racing it: without this a
      // slow early keystroke can land after a fast later one and repopulate the
      // list with results for a term the member has already moved past.
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      searchInstitutions(term, country, kind, controller.signal)
        .then((page) => {
          if (controller.signal.aborted) return
          setOptions(toOptions(page.results))
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // An empty term is intentional on mount and on a country change: the API
    // answers it with the most-picked institutions for that country, so the
    // field is useful before anyone types.
  }, [term, country, kind])

  useEffect(() => () => abortRef.current?.abort(), [])

  /**
   * The saved value has to be present as an option or the field renders blank
   * until the member searches for it again.
   */
  const withCurrent: SelectOptionLike[] = (() => {
    const list = [...options]
    if (value && value !== OTHER_INSTITUTION && !list.some((o) => o.value === value)) {
      list.unshift({ value, label: valueName || value })
    }
    return [...list, { value: OTHER_INSTITUTION, label: 'Other / not listed' }]
  })()

  return (
    <SelectDropdown
      label={label}
      placeholder=""
      options={withCurrent}
      value={value}
      onChange={(slug) => {
        const picked = withCurrent.find((o) => o.value === slug)
        onChange(slug, slug === OTHER_INSTITUTION ? '' : (picked?.label ?? ''))
      }}
      searchable
      onSearchChange={setTerm}
      loading={loading}
      disabled={disabled}
      emptyText="No match — choose “Other / not listed”"
      // The catalog already ranks the results; pinning the selection on top
      // would fight that ordering.
      selectedFirst={false}
    />
  )
}
