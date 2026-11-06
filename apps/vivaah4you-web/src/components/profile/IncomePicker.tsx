'use client'

import React, { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { SelectDropdown } from '@lokesh-workspace/ui'

import { incomeBracketsFor, type SelectOptionLike } from '@/lib/catalog'
import { currencyForCountry, incomeOptionsForCountry } from '@/constants/selectOptions/income'

interface Props {
  label: string
  /** ISO-2 country whose currency the brackets are quoted in. */
  country: string
  value: string
  onChange: (value: string) => void
  /** The currency the pick was made in, so it can be stored beside the tier. */
  onCurrencyChange?: (currency: string) => void
  errorValue?: string
  onBlur?: () => void
  disabled?: boolean
}

/**
 * Annual income, quoted in the currency of where the member lives.
 *
 * The nine values are the same everywhere - see `constants/selectOptions/income`
 * - so changing country relabels the list without invalidating an answer, and a
 * member who has already picked keeps their tier. That is the whole reason the
 * slug is a tier rather than an amount.
 *
 * Options come from the API, like VisaStatusPicker's, so the wizard can never
 * offer something the server would reject; the bundled mirror is the fallback
 * for a failed fetch, because an income step with an empty dropdown cannot be
 * completed and this field is required.
 */
export default function IncomePicker({
  label,
  country,
  value,
  onChange,
  onCurrencyChange,
  errorValue,
  onBlur,
  disabled,
}: Props) {
  const [options, setOptions] = useState<SelectOptionLike[]>(() =>
    incomeOptionsForCountry(country),
  )

  useEffect(() => {
    let cancelled = false

    // Paint the bundled list immediately: the labels are the same ones the API
    // will answer with, so the member never sees the dropdown change under them.
    setOptions(incomeOptionsForCountry(country))
    onCurrencyChange?.(currencyForCountry(country))

    incomeBracketsFor(country).then((list) => {
      if (cancelled || list.length === 0) return
      setOptions(list)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country])

  return (
    <SelectDropdown
      label={label}
      icon={<Wallet />}
      errorValue={errorValue}
      onBlur={onBlur}
      placeholder=""
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  )
}
