'use client'

import React from 'react'
import Link from 'next/link'

import { iconFor } from '@/lib/profileIcons'
import type { AttrVerdict, Compatibility, PrefVerdict } from '@/lib/compatibility'

/** Ring showing how much of what you asked for this person meets. */
function ScoreRing({ value }: { value: number }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className="strength-ring strength-ring-sm" role="img" aria-label={`${clamped}% of your preferences met`}>
      <svg viewBox="0 0 64 64" className="strength-ring-svg" aria-hidden="true">
        <circle className="strength-ring-track" cx="32" cy="32" r={radius} />
        <circle
          className="strength-ring-value"
          cx="32"
          cy="32"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
        />
      </svg>
      <span className="strength-ring-label">{clamped}%</span>
    </div>
  )
}

/**
 * The mark in the middle of a comparison row.
 *
 * Shape carries the meaning as well as colour - filled, outlined and dashed are
 * distinguishable without seeing hue - and the word itself is always present
 * for screen readers.
 */
function Mark({ verdict, word }: { verdict: 'same' | 'differ' | 'unknown'; word: string }) {
  return (
    <span className={`compat-mark compat-mark-${verdict}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {verdict === 'same' && <path d="M20 6 9 17l-5-5" />}
        {verdict === 'differ' && <path d="M18 6 6 18M6 6l12 12" />}
        {verdict === 'unknown' && <path d="M5 12h14" />}
      </svg>
      <span className="sr-only">{word}</span>
    </span>
  )
}

const ATTR_WORD: Record<AttrVerdict, string> = {
  same: 'Same',
  differ: 'Different',
  unknown: 'Not answered',
}

const PREF_WORD: Record<PrefVerdict, string> = {
  pass: 'Met',
  fail: 'Not met',
  'no-preference': 'No preference',
  unanswered: 'You have not said',
  unknown: 'They have not said',
}

interface Props {
  compatibility: Compatibility
  /** Their first name, used as the right-hand column heading. */
  theirName: string
}

export default function CompatibilityPanel({ compatibility, theirName }: Props) {
  const { attributes, preferences, met, considered, score, mutual } = compatibility

  // Preferences worth showing: the ones that were actually stated. Rows the
  // member never filled in belong in the wizard, not on this panel.
  const shownPrefs = preferences.filter((p) => p.verdict !== 'unanswered')

  return (
    <section className="panel compat" aria-label={`How you compare with ${theirName}`}>
      <div className="compat-head">
        {score === null ? (
          <div className="compat-noscore">
            <p className="compat-noscore-title">No partner preferences set</p>
            <p className="compat-noscore-text">
              Tell us what you are looking for and we can show how well each profile fits.
            </p>
            <Link href="/profile/register?step=5" className="btn-primary mt-3">
              Set your preferences
            </Link>
          </div>
        ) : (
          <>
            <ScoreRing value={score} />
            <div className="min-w-0">
              <p className="compat-score-title">
                Meets {met} of {considered} {considered === 1 ? 'thing' : 'things'} you asked for
              </p>
              {mutual === 'both' && (
                <p className="compat-badge">You each match what the other is looking for</p>
              )}
              {mutual === 'them-only' && (
                <p className="compat-score-text">You match their preferences.</p>
              )}
            </div>
          </>
        )}
      </div>

      {shownPrefs.length > 0 && (
        <ul className="compat-prefs">
          {shownPrefs.map((pref) => (
            <li key={pref.key} className={`compat-pref compat-pref-${pref.verdict}`}>
              <Mark
                verdict={pref.verdict === 'pass' ? 'same' : pref.verdict === 'fail' ? 'differ' : 'unknown'}
                word={PREF_WORD[pref.verdict]}
              />
              <span className="compat-pref-label">{pref.label}</span>
              <span className="compat-pref-value">
                {pref.verdict === 'no-preference'
                  ? 'No preference'
                  : pref.actual || 'Not answered'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="compat-cols" aria-hidden="true">
        <span>You</span>
        <span />
        <span>{theirName}</span>
      </div>

      {/* Plain elements rather than a <dl>: a definition list would need each
          row to be <dt> then <dd>, and this row is value / label / value. The
          reading order below still comes out as a sentence. */}
      <div className="compat-rows">
        {attributes.map((row) => {
          const Icon = iconFor(row.key)
          return (
            <div key={row.key} className={`compat-row compat-row-${row.verdict}`}>
              <span className="compat-me">
                <span className="sr-only">You: </span>
                {row.mine || '—'}
              </span>

              <span className="compat-axis" title={row.label}>
                {Icon ? (
                  <>
                    <Icon className="compat-icon" strokeWidth={1.6} aria-hidden="true" />
                    <span className="sr-only">{row.label}</span>
                  </>
                ) : (
                  <span className="compat-axis-label">{row.label}</span>
                )}
                <Mark verdict={row.verdict} word={ATTR_WORD[row.verdict]} />
              </span>

              <span className="compat-them">
                <span className="sr-only">{theirName}: </span>
                {row.theirs || '—'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
