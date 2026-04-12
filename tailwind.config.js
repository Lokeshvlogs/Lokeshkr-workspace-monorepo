const { bg } = require('zod/locales');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial']
      },
      colors: {
            "color-primary": "var(--color-primary)",
            "color-primary-light": "var(--color-primary-light)",
            "color-bg": "var(--color-bg)",
            "color-border": "var(--color-border)",
            "color-error": "var(--color-error)",
            "color-success": "var(--color-success)",
            "color-placeholder-text": "var(--color-placeholder-text)"
      },
      borderRadius: {
        md: "8px",
      }
    }
  },
  plugins: []
}
