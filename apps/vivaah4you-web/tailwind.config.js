/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@lokesh-workspace/ui/tailwind-preset')],
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    '../../packages/ui/src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        // --font-inter is set by next/font in app/layout.tsx. The rest of the
        // stack is the system grotesque Instagram falls back to, so the page
        // still reads the same way before the webfont lands.
        sans: [
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
}
