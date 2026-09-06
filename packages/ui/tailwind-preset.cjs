/** @type {import('tailwindcss').Config} */

/**
 * A theme colour that supports Tailwind's `/alpha` modifier.
 *
 * A bare `var(--token)` string does not: Tailwind tries to parse it as a colour
 * to composite the alpha, fails, and silently drops the modifier - so
 * `to-color-primary-surface/40` rendered fully opaque. With no modifier
 * Tailwind passes its own `var(--tw-*-opacity)` (declared as 1 in the same
 * rule), so the output is identical to the previous behaviour.
 */
const token = (name) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `var(${name})`
    : `color-mix(in srgb, var(${name}) calc(${opacityValue} * 100%), transparent)`

module.exports = {
  theme: {
    extend: {
      colors: {
        'color-primary': token('--color-primary'),
        'color-primary-strong': token('--color-primary-strong'),
        'color-primary-light': token('--color-primary-light'),
        'color-primary-extra-light': token('--color-primary-extra-light'),
        'color-primary-tint': token('--color-primary-tint'),
        'color-primary-surface': token('--color-primary-surface'),
        'color-secondary': token('--color-secondary'),
        'color-bg': token('--color-bg'),
        'color-border': token('--color-border'),
        'color-error': token('--color-error'),
        'color-success': token('--color-success'),
        'color-placeholder-text': token('--color-placeholder-text'),
        'color-primary-text': token('--color-primary-text')
      },
      borderRadius: {
        md: '8px'
      }
    }
  }
}
