'use client'

import React from 'react'
import Link from 'next/link'

import type { Compatibility, PrefVerdict } from '@/lib/compatibility'
import type { PublicProfile } from '@/types/profile'
import Avatar from '@/components/profile/Avatar'
import FamilyGraph from '@/components/profile/FamilyGraph'

/** Ring showing how much of what was asked for is met. */
function ScoreRing({ value, label }: { value: number; label: string }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className="strength-ring strength-ring-sm" role="img" aria-label={label}>
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
 * The mark against one preference.
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

const MARK_FOR: Record<PrefVerdict, 'same' | 'differ' | 'unknown'> = {
  pass: 'same',
  fail: 'differ',
  'no-preference': 'unknown',
  unanswered: 'unknown',
  unknown: 'unknown',
}

const WORD_FOR: Record<PrefVerdict, string> = {
  pass: 'You meet this',
  fail: 'You do not meet this',
  'no-preference': 'No preference',
  unanswered: 'Not stated',
  unknown: 'You have not answered this',
}

/** "His" / "Her", falling back to the name when gender is unstated. */
function possessive(gender: string | undefined, name: string): string {
  if (gender === 'male') return 'His'
  if (gender === 'female') return 'Her'
  return `${name}'s`
}

interface Props {
  compatibility: Compatibility
  /** Their first name, used in labels and under their photo. */
  theirName: string
  theirPhoto?: string | null
  /** 'male' | 'female' | 'other', for "His" / "Her". */
  theirGender?: string
  myName?: string
  myPhoto?: string | null
  /** Their profile id, so their family can be read alongside yours. */
  theirProfileId?: string
  /** Both profiles, so each family graph can imply its unnamed members. */
  myProfile?: PublicProfile | null
  theirProfile?: PublicProfile | null
}

/**
 * Whether you fit what this member is looking for.
 *
 * Reads in one direction on purpose - their stated preferences against your
 * profile - because that is the question a reader actually has when deciding
 * whether to reach out. This panel used to lead with the opposite ("does this
 * person meet what you asked for") and carry both, which put two different
 * percentages on one card and answered neither question clearly.
 */
export default function CompatibilityPanel({
  compatibility,
  theirName,
  theirPhoto,
  theirGender,
  myName = 'You',
  myPhoto,
  theirProfileId,
  myProfile,
  theirProfile,
}: Props) {
  const { reverse, reverseMet, reverseConsidered, reverseScore, mutual } = compatibility
  const whose = possessive(theirGender, theirName)

  return (
    <section className="panel compat" aria-label={`How you fit ${theirName}'s preferences`}>
      <div className="compat-head">
        {reverseScore === null ? (
          <div className="compat-noscore">
            <p className="compat-noscore-title">{theirName} has not set any preferences</p>
            <p className="compat-noscore-text">
              There is nothing to measure against yet. Your own preferences still help us find
              people for you.
            </p>
            <Link href="/profile/register?step=5" className="btn-primary mt-3">
              Set your preferences
            </Link>
          </div>
        ) : (
          <>
            <ScoreRing
              value={reverseScore}
              label={`You meet ${reverseScore}% of ${theirName}'s preferences`}
            />
            <div className="min-w-0">
              <p className="compat-score-title">
                You meet {reverseMet} of {reverseConsidered}{' '}
                {reverseConsidered === 1 ? 'thing' : 'things'} {theirName} asked for
              </p>
              {mutual === 'both' && (
                <p className="compat-badge">You each match what the other is looking for</p>
              )}
              {mutual === 'you-only' && (
                <p className="compat-score-text">They also meet your preferences.</p>
              )}
            </div>
          </>
        )}
      </div>

      <h3 className="compat-subhead">{whose} preferences</h3>

      {/* Their picture on the left, over the column of things they asked for;
          yours on the right, over the column of ticks. Both sit on the same
          grid as the rows, so each column falls under the person it is about. */}
      <div className="compat-faces compat-grid">
        <div className="compat-face compat-face-left">
          <Avatar src={theirPhoto} name={theirName} className="compat-face-avatar" decorative />
          <span className="compat-face-name">{theirName}</span>
        </div>

        <div className="compat-link">
          {reverseScore !== null && (
            <ScoreRing value={reverseScore} label={`${reverseScore}% match with ${theirName}`} />
          )}
          <span className="compat-link-line">
            <span className="compat-link-label">Match</span>
          </span>
        </div>

        <div className="compat-face compat-face-right">
          <Avatar src={myPhoto} name={myName} className="compat-face-avatar" decorative />
          <span className="compat-face-name">You</span>
        </div>
      </div>

      {/* Every preference, answered or not: someone deciding whether to reach
          out wants to see what was left open as much as what was asked for. */}
      <div className="compat-rows">
        {reverse.map((pref) => (
          <div key={pref.key} className={`compat-row compat-grid compat-row-${pref.verdict}`}>
            <span className="compat-want">
              <span className="compat-want-label">{pref.label}</span>
              <span className="compat-want-value">{pref.wanted || 'No preference'}</span>
            </span>

            <span aria-hidden="true" />

            <span className="compat-verdict">
              <Mark verdict={MARK_FOR[pref.verdict]} word={WORD_FOR[pref.verdict]} />
            </span>
          </div>
        ))}
      </div>

      {/* Both households, side by side. On a matrimonial match this is often
          the comparison that actually decides it, and reading one family then
          scrolling away to find the other made it impossible to hold both in
          mind at once. */}
      {theirProfileId && (
        <>
          <h3 className="compat-subhead">Both families</h3>

          <div className="family-compare">
            <FamilyGraph
              compact
              profile={myProfile}
              heading="Yours"
              selfLabel="You"
              selfName={myName}
              selfPhoto={myPhoto}
            />
            <FamilyGraph
              compact
              profile={theirProfile}
              profileId={theirProfileId}
              heading={`${theirName}'s`}
              selfLabel={theirName}
              selfName={theirName}
              selfPhoto={theirPhoto}
            />
          </div>
        </>
      )}
    </section>
  )
}
