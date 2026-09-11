'use client'

import React, { useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'

import { looksLikeUrl, providerFor } from '@/config/linkPreview'
import { ProviderGlyph, providerLabel } from '@/components/profile/providerGlyph'
import type { MediaPick } from '@/types/profile'

interface Props {
  label: string
  icon?: React.ReactNode
  hint?: string
  placeholder?: string
  value: MediaPick[]
  onChange: (picks: MediaPick[]) => void
  maxPicks?: number
}

const EMPTY_PICK: MediaPick = { title: '', subtitle: '', url: '', provider: '', thumbnail: '' }

/**
 * A readable name guessed from a URL, for when the unfurl came back empty.
 *
 * Goodreads and Wattpad both put the real title in the path
 * (`/book/show/2767052-the-hunger-games`), so this recovers it for exactly the
 * providers most likely to block the fetch. When it recovers nothing useful the
 * row is left blank for the member to type over, which is better than showing
 * them a URL as the name of their favourite book.
 *
 * Any word containing a digit is dropped, because those are ids rather than
 * words: without it an IMDb link would be titled "Tt0111161" and a Wattpad one
 * "237369078", both of which look like a bug rather than a blank to fill in.
 */
function titleFromUrl(raw: string): string {
  try {
    const { pathname } = new URL(raw)
    const last = pathname.split('/').filter(Boolean).pop() ?? ''
    const words = last
      .replace(/\.[a-z0-9]{2,4}$/i, '')
      .split('-')
      .filter((word) => word && !/\d/.test(word))
    if (words.length === 0) return ''
    return words.join(' ').replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return ''
  }
}

/** `www.x.com/y` is what people paste; `new URL` needs the scheme. */
const withScheme = (text: string): string =>
  /^https?:\/\//i.test(text) ? text : `https://${text.replace(/^\/+/, '')}`

/**
 * One category of named picks - a song, a film, a book.
 *
 * The input takes either a title or a link, deliberately, in one box. Asking
 * "name or link?" up front would make a member choose before they know what
 * they have; pasting a link and getting artwork back is the moment that makes
 * the feature obvious.
 *
 * Every title stays editable after it resolves. That is not a nicety: IMDb and
 * Goodreads block server-side fetches often enough that a blank or wrong title
 * has to be fixable, and an unfurled title is a guess like any other.
 */
export default function MediaPickField({
  label,
  icon,
  hint,
  placeholder,
  value,
  onChange,
  maxPicks = 8,
}: Props) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const picks = value ?? []
  const full = picks.length >= maxPicks

  const setTitle = (index: number, title: string) =>
    onChange(picks.map((pick, i) => (i === index ? { ...pick, title } : pick)))

  const remove = (index: number) => onChange(picks.filter((_, i) => i !== index))

  const add = async () => {
    const entry = text.trim()
    if (!entry || full || busy) return

    if (!looksLikeUrl(entry)) {
      onChange([...picks, { ...EMPTY_PICK, title: entry }])
      setText('')
      return
    }

    const url = withScheme(entry)
    const provider = providerFor(url)

    // Not a site we can read. Saved as a plain title rather than refused: the
    // member knows what they meant, and the server would drop the link anyway.
    if (!provider) {
      onChange([...picks, { ...EMPTY_PICK, title: titleFromUrl(url) || entry }])
      setText('')
      return
    }

    setBusy(true)
    const found = await fetch('/api/unfurl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
    setBusy(false)

    onChange([
      ...picks,
      {
        title: String(found?.title ?? '') || titleFromUrl(url),
        subtitle: String(found?.subtitle ?? ''),
        url,
        provider,
        thumbnail: String(found?.thumbnail ?? ''),
      },
    ])
    setText('')
  }

  return (
    <fieldset className="pick-field">
      <legend className={`chip-group-label ${icon ? 'chip-group-label-icon' : ''}`}>
        {icon && (
          <span className="field-label-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {label}
        {picks.length > 0 && (
          <span className="chip-count">
            {picks.length}/{maxPicks}
          </span>
        )}
      </legend>

      {hint && <p className="form-section-hint mb-3">{hint}</p>}

      {picks.length > 0 && (
        <ul className="pick-rows">
          {picks.map((pick, index) => (
            <li key={`${pick.url || pick.title}-${index}`} className="pick-row">
              <span className="pick-art" aria-hidden="true">
                {pick.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pick.thumbnail}
                    alt=""
                    loading="lazy"
                    // The artwork is on a third party's CDN; there is no reason
                    // to tell them which profile page it was loaded from.
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ProviderGlyph provider={pick.provider} />
                )}
              </span>

              <span className="pick-row-body">
                <input
                  className="pick-title-input"
                  value={pick.title}
                  placeholder="Name this one"
                  aria-label={`${label} title`}
                  maxLength={120}
                  onChange={(event) => setTitle(index, event.target.value)}
                />
                <span className="pick-row-meta">
                  {pick.subtitle && <span className="pick-subtitle">{pick.subtitle}</span>}
                  {pick.provider && (
                    <span className="pick-provider">
                      {providerLabel(pick.provider)}
                    </span>
                  )}
                </span>
              </span>

              <button
                type="button"
                className="pick-remove"
                onClick={() => remove(index)}
                aria-label={`Remove ${pick.title || 'this entry'}`}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="pick-add">
        <input
          className="input-field"
          value={text}
          placeholder={full ? `That is ${maxPicks} — plenty` : placeholder}
          aria-label={`Add to ${label}`}
          disabled={full}
          maxLength={400}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            // Enter inside a wizard step would otherwise submit the step.
            event.preventDefault()
            add()
          }}
        />
        <button
          type="button"
          className="chip chip-selected pick-add-btn"
          onClick={add}
          disabled={full || busy || !text.trim()}
        >
          {busy ? (
            <>
              <Loader2 size={14} className="pick-spin" aria-hidden="true" />
              Fetching…
            </>
          ) : (
            <>
              <Plus size={14} aria-hidden="true" />
              Add
            </>
          )}
        </button>
      </div>
    </fieldset>
  )
}

