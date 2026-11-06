import { SelectOption } from '@lokesh-workspace/ui'

/**
 * Annual-income brackets, per currency.
 *
 * THIS FILE IS A MIRROR of `services/vivaah4u-api/apps/catalog/income.py` and
 * the two have to be edited together. The server is the source of truth - the
 * wizard fetches its options from `/catalog/income-brackets` so a member never
 * picks a value the API would reject - but display has no time to ask: a grid
 * of 48 cards would mean 48 round trips to print a currency symbol.
 *
 * THE SLUG IS A TIER, NOT AN AMOUNT. All nine values are the ones profiles have
 * always stored ("0-5" ... "500+"); every currency maps the same nine onto money
 * that makes sense where it is earned. That is what lets one income filter match
 * the same tier in every currency, and it is why nothing had to migrate.
 */

/** The nine tiers, in order. Every currency's label list matches this exactly. */
export const INCOME_TIERS = [
  '0-5', '5-10', '10-15', '15-25', '25-50', '50-100', '100-200', '200-500', '500+',
] as const

/** ISO-2 country -> currency. Anything unlisted falls back to DEFAULT_CURRENCY. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  IN: 'INR', US: 'USD', CA: 'CAD', GB: 'GBP', AE: 'AED', SA: 'SAR', QA: 'QAR',
  KW: 'KWD', OM: 'OMR', BH: 'BHD', AU: 'AUD', NZ: 'NZD', SG: 'SGD', MY: 'MYR',
  HK: 'HKD', JP: 'JPY', CH: 'CHF', ZA: 'ZAR', LK: 'LKR', NP: 'NPR', BD: 'BDT',
  PK: 'PKR',
  // The euro, spelled out per country so a lookup never needs a second table.
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR',
  IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR',
}

/**
 * A member whose country is not listed above. INR rather than USD: this is an
 * Indian matrimony product, so an unmapped country is far more likely to be a
 * gap in the table than a member genuinely earning in dollars.
 */
export const DEFAULT_CURRENCY = 'INR'

/** currency -> the nine labels, in tier order. */
const LABELS: Record<string, readonly string[]> = {
  // L and Cr rather than "lacs" and "crores": these labels share a card row
  // with the education beside them, and the words were eating the width that
  // qualification needed.
  INR: ['₹0-5L', '₹5-10L', '₹10-15L', '₹15-25L', '₹25-50L',
        '₹50L-1Cr', '₹1-2Cr', '₹2-5Cr', '₹5Cr+'],
  USD: ['$0-15k', '$15-30k', '$30-45k', '$45-75k', '$75-150k',
        '$150-300k', '$300-600k', '$600k-1.5M', '$1.5M+'],
  CAD: ['C$0-20k', 'C$20-40k', 'C$40-60k', 'C$60-100k', 'C$100-200k',
        'C$200-400k', 'C$400-800k', 'C$800k-2M', 'C$2M+'],
  GBP: ['£0-12k', '£12-25k', '£25-35k', '£35-60k', '£60-120k',
        '£120-250k', '£250-500k', '£500k-1.2M', '£1.2M+'],
  EUR: ['€0-15k', '€15-30k', '€30-45k', '€45-75k', '€75-150k',
        '€150-300k', '€300-600k', '€600k-1.5M', '€1.5M+'],
  AED: ['AED 0-60k', 'AED 60-120k', 'AED 120-180k', 'AED 180-300k', 'AED 300-600k',
        'AED 600k-1.2M', 'AED 1.2-2.4M', 'AED 2.4-6M', 'AED 6M+'],
  SAR: ['SAR 0-60k', 'SAR 60-120k', 'SAR 120-180k', 'SAR 180-300k', 'SAR 300-600k',
        'SAR 600k-1.2M', 'SAR 1.2-2.4M', 'SAR 2.4-6M', 'SAR 6M+'],
  QAR: ['QAR 0-60k', 'QAR 60-120k', 'QAR 120-180k', 'QAR 180-300k', 'QAR 300-600k',
        'QAR 600k-1.2M', 'QAR 1.2-2.4M', 'QAR 2.4-6M', 'QAR 6M+'],
  KWD: ['KD 0-5k', 'KD 5-10k', 'KD 10-15k', 'KD 15-25k', 'KD 25-50k',
        'KD 50-100k', 'KD 100-200k', 'KD 200-500k', 'KD 500k+'],
  OMR: ['OMR 0-6k', 'OMR 6-12k', 'OMR 12-18k', 'OMR 18-30k', 'OMR 30-60k',
        'OMR 60-120k', 'OMR 120-240k', 'OMR 240-600k', 'OMR 600k+'],
  BHD: ['BD 0-6k', 'BD 6-12k', 'BD 12-18k', 'BD 18-30k', 'BD 30-60k',
        'BD 60-120k', 'BD 120-240k', 'BD 240-600k', 'BD 600k+'],
  AUD: ['A$0-25k', 'A$25-45k', 'A$45-70k', 'A$70-110k', 'A$110-220k',
        'A$220-450k', 'A$450-900k', 'A$900k-2.2M', 'A$2.2M+'],
  NZD: ['NZ$0-25k', 'NZ$25-45k', 'NZ$45-70k', 'NZ$70-110k', 'NZ$110-220k',
        'NZ$220-450k', 'NZ$450-900k', 'NZ$900k-2.2M', 'NZ$2.2M+'],
  SGD: ['S$0-25k', 'S$25-45k', 'S$45-70k', 'S$70-120k', 'S$120-240k',
        'S$240-480k', 'S$480k-1M', 'S$1-2.5M', 'S$2.5M+'],
  MYR: ['RM0-40k', 'RM40-80k', 'RM80-120k', 'RM120-200k', 'RM200-400k',
        'RM400-800k', 'RM800k-1.6M', 'RM1.6-4M', 'RM4M+'],
  HKD: ['HK$0-150k', 'HK$150-300k', 'HK$300-450k', 'HK$450-750k', 'HK$750k-1.5M',
        'HK$1.5-3M', 'HK$3-6M', 'HK$6-15M', 'HK$15M+'],
  JPY: ['¥0-2M', '¥2-4M', '¥4-6M', '¥6-10M', '¥10-20M',
        '¥20-40M', '¥40-80M', '¥80-200M', '¥200M+'],
  CHF: ['CHF 0-40k', 'CHF 40-70k', 'CHF 70-100k', 'CHF 100-150k', 'CHF 150-300k',
        'CHF 300-600k', 'CHF 600k-1.2M', 'CHF 1.2-3M', 'CHF 3M+'],
  ZAR: ['R0-200k', 'R200-400k', 'R400-600k', 'R600k-1M', 'R1-2M',
        'R2-4M', 'R4-8M', 'R8-20M', 'R20M+'],
  LKR: ['Rs 0-1.5M', 'Rs 1.5-3M', 'Rs 3-4.5M', 'Rs 4.5-7.5M', 'Rs 7.5-15M',
        'Rs 15-30M', 'Rs 30-60M', 'Rs 60-150M', 'Rs 150M+'],
  NPR: ['NRs 0-8L', 'NRs 8-16L', 'NRs 16-24L', 'NRs 24-40L',
        'NRs 40-80L', 'NRs 80L-1.6Cr', 'NRs 1.6-3.2Cr',
        'NRs 3.2-8Cr', 'NRs 8Cr+'],
  BDT: ['৳0-6L', '৳6-12L', '৳12-18L', '৳18-30L',
        '৳30-60L', '৳60L-1.2Cr', '৳1.2-2.4Cr',
        '৳2.4-6Cr', '৳6Cr+'],
  PKR: ['Rs 0-15L', 'Rs 15-30L', 'Rs 30-45L', 'Rs 45-75L',
        'Rs 75L-1.5Cr', 'Rs 1.5-3Cr', 'Rs 3-6Cr',
        'Rs 6-15Cr', 'Rs 15Cr+'],
}

/** The currency a member in `country` is offered. Never blank. */
export function currencyForCountry(country?: string | null): string {
  return COUNTRY_CURRENCY[(country || '').toUpperCase()] ?? DEFAULT_CURRENCY
}

function labelsFor(currency?: string | null): readonly string[] {
  return LABELS[(currency || '').toUpperCase()] ?? LABELS[DEFAULT_CURRENCY]
}

/** The nine brackets of one currency, as dropdown options. */
export function incomeOptionsFor(currency?: string | null): SelectOption[] {
  const labels = labelsFor(currency)
  return INCOME_TIERS.map((value, i) => ({ value, label: labels[i] }))
}

/** The same, keyed by the member's country rather than their currency. */
export function incomeOptionsForCountry(country?: string | null): SelectOption[] {
  return incomeOptionsFor(currencyForCountry(country))
}

/**
 * The display label for one tier in one currency.
 *
 * Falls back to the raw slug rather than to a blank, mirroring
 * `income.label_for` on the server: a member who moves country keeps their
 * stored tier until they re-answer, so a value can outlive the currency it was
 * picked in, and something recognisable beats nothing.
 */
export function incomeLabelFor(currency: string | null | undefined, value: string): string {
  if (!value) return ''
  const index = INCOME_TIERS.indexOf(value as (typeof INCOME_TIERS)[number])
  return index === -1 ? value : labelsFor(currency)[index]
}
