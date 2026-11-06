import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'LucyMixer',
  description: 'Edit reels, Shorts and posts in your browser: timeline, keyframes, templates, effects and stickers. Your media stays on your computer.'
}

export const viewport: Viewport = {
  themeColor: '#0d0d0f'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
