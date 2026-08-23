/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        'color-primary': 'var(--color-primary)',
        'color-primary-light': 'var(--color-primary-light)',
        'color-primary-extra-light': 'var(--color-primary-extra-light)',
        'color-primary-surface': 'var(--color-primary-surface)',
        'color-bg': 'var(--color-bg)',
        'color-border': 'var(--color-border)',
        'color-error': 'var(--color-error)',
        'color-success': 'var(--color-success)',
        'color-placeholder-text': 'var(--color-placeholder-text)',
        'color-primary-text': 'var(--color-primary-text)'
      },
      borderRadius: {
        md: '8px'
      }
    }
  }
}
