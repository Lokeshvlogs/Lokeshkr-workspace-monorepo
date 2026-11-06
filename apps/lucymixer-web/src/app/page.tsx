import Link from 'next/link'
import AccountButton from '@/components/AccountButton'

const FEATURES = [
  { title: 'Multi-track timeline', text: 'Cut, trim, ripple and push clips, transitions, track mute and solo.' },
  { title: 'Keyframes', text: 'Animate position, size, rotation and opacity with linear or Bézier easing.' },
  { title: 'Templates', text: 'Split-screen reactions, banners, news and quote layouts for reels and Shorts.' },
  { title: 'Effects & colour', text: 'Filters, curves, HSL, green-screen removal, blur, glow and more (WebGL).' },
  { title: 'Text & stickers', text: '3D text, brush lettering, animated emoji stickers, shapes and drawing.' },
  { title: 'Private by design', text: 'Everything runs in your browser. Your media is never uploaded.' }
]

export default function Home() {
  return (
    <main className="lm-page">
      <header className="lm-header">
        <span className="lm-logo">LucyMixer</span>
        <nav className="lm-nav">
          <Link href="/desktop">Desktop app</Link>
          <AccountButton next="/editor" />
        </nav>
      </header>

      <section className="lm-hero">
        <h1>Edit reels, Shorts and posts right in your browser</h1>
        <p>
          A timeline editor for social media: templates, keyframes, effects and stickers. Use your own
          files, and after signing in, see the favorites and history you saved with the Fullscreen Viewer
          extension.
        </p>
        <div className="lm-actions">
          <Link className="lm-btn lm-btn-primary lm-btn-big" href="/editor">
            Open the editor
          </Link>
          <span className="lm-muted">Free · Google sign-in is optional</span>
        </div>
      </section>

      <section className="lm-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="lm-card">
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      <section className="lm-note">
        <strong>Working with 4K?</strong> LucyMixer handles media up to 2560×1440. For 4K and larger,
        professional colour grading and big local projects, see the <Link href="/desktop">desktop app</Link>.
      </section>

      <footer className="lm-footer">
        LucyMixer is an independent tool, not affiliated with Instagram, YouTube or TikTok.
      </footer>
    </main>
  )
}
