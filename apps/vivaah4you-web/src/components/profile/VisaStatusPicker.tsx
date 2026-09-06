'use client'
import { BadgeCheck } from 'lucide-react'

import React, { useEffect, useState } from 'react'
import { SelectDropdown } from '@lokesh-workspace/ui'

import { visaStatusesFor, type SelectOptionLike } from '@/lib/catalog'

interface Props {
  country: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/**
 * Residency status, with options that suit the country of work.
 *
 * Served from the API rather than bundled, because the meaningful statuses are
 * completely different per country - a US list needs H-1B and a green card, a
 * UK list needs ILR - and a generic "work visa" tells a reader nothing about
 * whether someone can stay or sponsor a spouse.
 */
export default function VisaStatusPicker({ country, value, onChange, disabled }: Props) {
  const [options, setOptions] = useState<SelectOptionLike[]>([])

  useEffect(() => {
    if (!country) {
      setOptions([])
      return
    }

    let cancelled = false
    visaStatusesFor(country).then((list) => {
      if (cancelled) return
      setOptions(list)
      // A status from the previous country is meaningless under the new one -
      // "Green card" makes no sense once the country is the UK.
      if (value && !list.some((o) => o.value === value)) onChange('')
    })

    return () => {
      cancelled = true
    }
  }, [country])

  return (
    <SelectDropdown
      label={country ? 'Residency status' : 'Residency status (pick a country first)'}
      icon={<BadgeCheck />}
      placeholder=""
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled || !country || options.length === 0}
    />
  )
}
