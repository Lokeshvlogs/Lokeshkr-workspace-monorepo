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
            primary: "var(--color-primary)",
            "primary-light": "var(--color-primary-light)",
            bg: "var(--color-bg)",
            border: "var(--color-border)",
            error: "var(--color-error)",
            success: "var(--color-success)",
      },
      borderRadius: {
        md: "8px",
      }
    }
  },
  plugins: []
}
