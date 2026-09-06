import '../globals.css'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '../components/navbar/Navbar'
import { AuthProvider } from '../components/authProvider'
import ThemePanel from '../components/dev/ThemePanel'

/*
 * One typeface for the whole product. Inter is the neo-grotesque closest to the
 * look Instagram gets from Instagram Sans - short ascenders, open apertures,
 * even colour at small sizes - and next/font self-hosts it, so there is no
 * external request and no flash of fallback text.
 *
 * `variable` exposes it as --font-inter, which tailwind.config.js reads for
 * `font-sans`; the class on <html> also makes it the document default.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Vivah4U',
  description: 'Modern Indian matrimonial platform'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {children}
          </main>
        </AuthProvider>
        {/* TEMPORARY development tool - renders null in production builds.
            Outside AuthProvider on purpose: it has nothing to do with sign-in
            state. Remove this line and src/components/dev/ThemePanel.tsx
            together when the palette is settled. */}
        <ThemePanel />
      </body>
    </html>
  )
}
