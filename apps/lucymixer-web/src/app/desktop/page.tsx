import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Desktop app · LucyMixer'
}

export default function DesktopPage() {
  return (
    <main className="lm-page">
      <header className="lm-header">
        <Link className="lm-logo" href="/">
          LucyMixer
        </Link>
      </header>
      <section className="lm-hero">
        <h1>For 4K and beyond: the desktop app</h1>
        <p>
          The web editor is made for social media, up to 2560×1440. A native desktop editor for 4K and
          larger media, with professional colour grading and fast local files, is in the works.
        </p>
      </section>
      <section className="lm-grid">
        <div className="lm-card">
          <h3>LucyCut Pro</h3>
          <p>Free. 4K+ editing on your PC, powered by C++ and Qt.</p>
          <p className="lm-muted">Coming soon</p>
        </div>
        <div className="lm-card">
          <h3>LucyStudio</h3>
          <p>Paid. Everything in LucyCut Pro plus advanced grading and pro features.</p>
          <p className="lm-muted">Coming soon</p>
        </div>
      </section>
      <p className="lm-note">
        Until then, <Link href="/editor">open the web editor</Link> for anything up to 1440p.
      </p>
    </main>
  )
}
