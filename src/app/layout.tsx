import '../globals.css'
import { Metadata } from 'next'
import Navbar from '../components/navbar/Navbar'

export const metadata: Metadata = {
  title: 'Vivah4U',
  description: 'Modern Indian matrimonial platform'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}
