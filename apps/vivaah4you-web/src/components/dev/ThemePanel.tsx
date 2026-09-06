'use client'

import React, { useCallback, useEffect, useState } from 'react'

/**
 * TEMPORARY development tool for trying out palettes.
 *
 * Writes CSS custom properties onto <html> as inline styles, which outrank both
 * `:root` blocks (the one in packages/ui/src/styles.css and the one in
 * globals.css) with no `!important` anywhere to fight.
 *
 * This is NOT a theming feature: the values live in this browser's
 * localStorage, nothing server-side knows about them, and it is not per-user.
 * When a palette is settled, use "Copy CSS" and paste the block into the
 * `:root` in globals.css.
 *
 * TO REMOVE: delete this file and the two lines that mount it in
 * src/app/layout.tsx. Nothing else refers to it.
 */

const STORAGE_KEY = 'vivaah4u-theme-draft'

interface Swatch {
  token: string
  label: string
  hint: string
}

/**
 * Only tokens that something actually reads. `--color-success` is defined in
 * both stylesheets and referenced nowhere, so a control for it would do
 * nothing and imply the opposite.
 */
const SWATCHES: Swatch[] = [
  { token: '--color-primary', label: 'Primary', hint: 'Buttons, links, selected states' },
  { token: '--color-primary-strong', label: 'Primary strong', hint: 'Text needing contrast on a tint' },
  { token: '--color-primary-light', label: 'Primary light', hint: 'Hover borders, gradient midpoint' },
  { token: '--color-primary-extra-light', label: 'Extra light', hint: 'Focus rings, scrollbars' },
  { token: '--color-primary-tint', label: 'Tint', hint: 'Hover fills, active rows, tracks' },
  { token: '--color-primary-surface', label: 'Surface', hint: 'Card and panel backgrounds' },
  { token: '--color-secondary', label: 'Secondary', hint: 'The other half of brand gradients' },
  { token: '--color-border', label: 'Border', hint: 'Every outline' },
  // NOT the page background: every consumer of --color-bg is a
  // `background-color` on an input, card, popup or pill. The page itself comes
  // from <main className="bg-gradient-to-b from-white to-gray-50"> in
  // layout.tsx and from dozens of `bg-white` classes, so a dark value here
  // gives dark cards floating on a white page. Labelled honestly.
  { token: '--color-bg', label: 'Card / control bg', hint: 'Inputs, cards, popups — not the page' },
  { token: '--color-primary-text', label: 'Text', hint: 'Only the 43 rules that read the token' },
  { token: '--color-placeholder-text', label: 'Muted text', hint: 'Hints, labels, captions' },
]

type Palette = Record<string, string>

/** `#abc` and `rgb(...)` both need normalising - a colour input only takes #rrggbb. */
function toHex(raw: string): string {
  const value = raw.trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase()
  }
  const rgb = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (rgb) {
    const hex = (n: string) => Number(n).toString(16).padStart(2, '0')
    return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`.toLowerCase()
  }
  return '#000000'
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

export default function ThemePanel() {
  // Next inlines NODE_ENV, so the whole component drops out of a production
  // build rather than shipping behind a runtime check.
  if (process.env.NODE_ENV === 'production') return null

  const [open, setOpen] = useState(false)
  const [palette, setPalette] = useState<Palette>({})
  const [copied, setCopied] = useState(false)

  const apply = useCallback((token: string, value: string) => {
    document.documentElement.style.setProperty(token, value)
  }, [])

  // Computed styles do not exist on the server, so this has to be an effect -
  // reading them during render is a hydration mismatch.
  useEffect(() => {
    const computed = getComputedStyle(document.documentElement)
    const current: Palette = {}
    for (const { token } of SWATCHES) {
      current[token] = toHex(computed.getPropertyValue(token))
    }

    let stored: Palette = {}
    try {
      stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    } catch {
      // Corrupt draft is not worth surfacing; fall back to the stylesheet.
    }

    for (const [token, value] of Object.entries(stored)) {
      if (current[token] === undefined) continue
      apply(token, value)
      current[token] = value
    }

    setPalette(current)
  }, [apply])

  const change = (token: string, raw: string) => {
    const value = toHex(raw)
    apply(token, value)
    setPalette((prev) => {
      const next = { ...prev, [token]: value }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Private mode. The change still applies for this page view.
      }
      return next
    })
  }

  const reset = () => {
    // Removing the inline property falls back to the `:root` value, which is
    // the pink default - that is exactly what "reset" should mean here.
    for (const { token } of SWATCHES) {
      document.documentElement.style.removeProperty(token)
    }
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* nothing to clear */
    }

    const computed = getComputedStyle(document.documentElement)
    const current: Palette = {}
    for (const { token } of SWATCHES) current[token] = toHex(computed.getPropertyValue(token))
    setPalette(current)
  }

  const copy = () => {
    const body = SWATCHES.map(({ token }) => `  ${token}: ${palette[token]};`).join('\n')
    navigator.clipboard
      .writeText(`:root {\n${body}\n}`)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      })
      .catch(() => setCopied(false))
  }

  if (!open) {
    return (
      <button
        type="button"
        className="theme-panel-fab"
        onClick={() => setOpen(true)}
        aria-label="Open theme controls"
        title="Theme controls (development only)"
      >
        <span aria-hidden="true">🎨</span>
        <span>Theme</span>
      </button>
    )
  }

  const bg = palette['--color-bg']
  const text = palette['--color-primary-text']
  // Below 4.5:1 body text stops being readable. Warn rather than auto-correct:
  // silently rewriting a value somebody just typed makes the tool untrustworthy.
  const ratio = bg && text ? contrastRatio(bg, text) : null
  const lowContrast = ratio !== null && ratio < 4.5

  return (
    <aside className="theme-panel" aria-label="Theme controls">
      <header className="theme-panel-head">
        <div>
          <p className="theme-panel-title">Theme</p>
          <p className="theme-panel-note">Development only · saved in this browser</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close theme controls">
          ✕
        </button>
      </header>

      <div className="theme-panel-rows">
        {SWATCHES.map(({ token, label, hint }) => (
          <label key={token} className="theme-panel-row" title={hint}>
            <input
              type="color"
              value={palette[token] ?? '#000000'}
              onChange={(e) => change(token, e.target.value)}
              aria-label={label}
            />
            <span className="theme-panel-label">
              {label}
              <span className="theme-panel-hint">{hint}</span>
            </span>
            <input
              type="text"
              className="theme-panel-hex"
              value={palette[token] ?? ''}
              onChange={(e) => change(token, e.target.value)}
              spellCheck={false}
              aria-label={`${label} hex value`}
            />
          </label>
        ))}
      </div>

      {lowContrast && (
        <p className="theme-panel-warn" role="status">
          Text on background is {ratio!.toFixed(1)}:1 — below the 4.5:1 minimum for body
          text. Lighten the background or darken the text.
        </p>
      )}

      {/* Says out loud what the panel cannot do, so a confusing result reads as
          a known limit rather than a broken tool. */}
      <p className="theme-panel-note theme-panel-foot">
        Most body text is <code>text-gray-900</code> from globals.css and will not follow
        the text token. The page background is a Tailwind gradient in layout.tsx, not a
        token.
      </p>

      <footer className="theme-panel-actions">
        <button type="button" onClick={reset}>Reset</button>
        <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy CSS'}</button>
      </footer>
    </aside>
  )
}
