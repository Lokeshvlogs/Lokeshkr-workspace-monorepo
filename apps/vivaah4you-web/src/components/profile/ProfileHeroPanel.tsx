'use client'

import React, { type ReactNode } from 'react'

import Avatar from '@/components/profile/Avatar'
import EditableField, { displayValue } from '@/components/profile/EditableField'
import FieldRow from '@/components/profile/FieldRow'
import NameWithBadge from '@/components/profile/NameWithBadge'
import { PROFILE_FIELDS } from '@/lib/profileFields'
import { presenceFor } from '@/lib/presence'
import { fullName } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

/**
 * The facts that used to make up the "Basic Details" section below the hero.
 *
 * They live beside the display picture now. `firstName` and `surname` are
 * deliberately not among them - the heading right above already prints the
 * full name, and repeating it as two more rows was the duplication this panel
 * was built to remove. Both keep their `PROFILE_FIELDS` entries, so the wizard
 * and the editor still know about them.
 */
const HERO_FACT_KEYS = [
  'age',
  'gender',
  'height',
  'maritalStatus',
  'bodyPhysique',
  'manglikLevel',
  'dob',
] as const

interface Props {
  profile: PublicProfile
  /** Owner-only: makes the facts inline-editable. */
  onSave?: (step: number, patch: Record<string, unknown>) => Promise<boolean>
  /** Buttons for the right-hand side - "Edit in wizard", "Express interest". */
  actions?: ReactNode
  /** Shown under the name. The profile id for the owner, a summary for a match. */
  subtitle?: ReactNode
}

export default function ProfileHeroPanel({ profile, onSave, actions, subtitle }: Props) {
  const name = fullName(profile) || 'Vivah4U member'
  const presence = presenceFor(profile.presence)

  // `dob` is owner-only and never reaches a public payload, so on a match it
  // simply has no value and drops out below.
  const facts = HERO_FACT_KEYS.map((key) => PROFILE_FIELDS.find((f) => f.key === key)).filter(
    (def): def is NonNullable<typeof def> => Boolean(def),
  )

  return (
    <section className="profile-hero">
      <div className="profile-hero-portrait">
        <Avatar src={profile.photo} name={name} className="profile-hero-avatar" decorative />
        {/* Only ever rendered when the server actually said something. A
            profile that has never been stamped shows no dot rather than an
            "offline" one we cannot stand behind. */}
        {presence.label && (
          <span
            className={`presence-dot ${presence.online ? 'presence-dot-online' : ''}`}
            title={presence.label}
          >
            <span className="sr-only">{presence.label}</span>
          </span>
        )}
      </div>

      <div className="profile-hero-body">
        <h2>
          <NameWithBadge
            name={name}
            level={profile.verification_level}
            size="lg"
            className="profile-hero-name"
          />
        </h2>

        {subtitle}

        {presence.label && (
          <p className={`presence-line ${presence.online ? 'presence-line-online' : ''}`}>
            {presence.label}
          </p>
        )}

        <dl className="hero-facts">
          {facts.map((def) => {
            const shown = displayValue(def, profile)
            // An unanswered fact is dropped on a match's profile but kept for
            // the owner, where the blank is the prompt to fill it in.
            if (!shown && !onSave) return null

            return onSave ? (
              <EditableField key={def.key} def={def} profile={profile} onSave={onSave} />
            ) : (
              <FieldRow key={def.key} fieldKey={def.key} label={def.label} value={shown} />
            )
          })}
        </dl>
      </div>

      {actions && <div className="profile-hero-actions">{actions}</div>}
    </section>
  )
}
