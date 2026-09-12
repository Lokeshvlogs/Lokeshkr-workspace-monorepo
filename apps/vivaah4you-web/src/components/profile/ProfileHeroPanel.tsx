'use client'

import React, { type ReactNode } from 'react'

import Avatar from '@/components/profile/Avatar'
import EditableField, { displayValue } from '@/components/profile/EditableField'
import { iconFor } from '@/lib/profileIcons'
import NameWithBadge from '@/components/profile/NameWithBadge'
import { PROFILE_FIELDS } from '@/lib/profileFields'
import { presenceFor } from '@/lib/presence'
import { fullName } from '@/lib/profileDisplay'
import IdentityNotice from '@/components/profile/IdentityNotice'
import HeroNameEditor from '@/components/profile/HeroNameEditor'
import type { IdentityGroup, IdentityLocks, PublicProfile, SaveField } from '@/types/profile'

/**
 * Which identity allowance each hero tile spends.
 *
 * `dob` is absent on purpose: one control writes both halves of the birth
 * timestamp, and they have separate allowances, so it is handled by hand below
 * rather than through this map.
 */
const TILE_GROUP: Record<string, IdentityGroup> = {
  gender: 'gender',
  height: 'height',
}

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
  onSave?: SaveField
  /** Buttons for the right-hand side - "Edit in wizard", "Express interest". */
  actions?: ReactNode
  /** Shown under the name. The profile id for the owner, a summary for a match. */
  subtitle?: ReactNode
  /**
   * What may still be changed about name, birth date, gender and height.
   *
   * Owner-only and absent for a visitor, who cannot edit anything here anyway.
   * Passed down rather than read off `profile`, which is typed as the public
   * shape and does not carry it.
   */
  identityLocks?: IdentityLocks
  /** Suppresses every warning - set while registering for the first time. */
  silentIdentity?: boolean
}

export default function ProfileHeroPanel({
  profile,
  onSave,
  actions,
  subtitle,
  identityLocks = {},
  silentIdentity = false,
}: Props) {
  const name = fullName(profile) || 'Vivah4U member'

  /**
   * The allowance a tile spends, or undefined where it spends none.
   *
   * The birth-date tile is the awkward one: it writes a date and a time that
   * have separate allowances, so it counts as locked only when neither half
   * can move - a fixed date must not take away the ability to correct a time,
   * which is the half people actually come back for.
   */
  const lockFor = (key: string) => {
    if (key !== 'dob') return identityLocks[TILE_GROUP[key]]
    const date = identityLocks.dob_date
    const time = identityLocks.dob_time
    if (!date && !time) return undefined
    return date?.locked && time?.locked ? date : (time ?? date)
  }

  /* Rendered inside the open editor by EditableField, so it appears exactly
     when the member starts editing and not a moment before. */
  const noticeFor = (key: string) => {
    if (key === 'dob') {
      return (
        <>
          <IdentityNotice lock={identityLocks.dob_date} what="date of birth" editing silent={silentIdentity} />
          <IdentityNotice lock={identityLocks.dob_time} what="time of birth" editing silent={silentIdentity} />
        </>
      )
    }
    const group = TILE_GROUP[key]
    if (!group) return null
    return <IdentityNotice lock={identityLocks[group]} what={key} editing silent={silentIdentity} />
  }
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
        <h2 className="profile-hero-heading">
          <NameWithBadge
            name={name}
            level={profile.verification_level}
            size="lg"
            className="profile-hero-name"
          />
          {/* The name is the heading, so it is edited here rather than being
              added to the tiles below - which is what `HERO_FACT_KEYS` has
              always deliberately excluded it from. */}
          {onSave && (
            <HeroNameEditor
              profile={profile}
              onSave={onSave}
              lock={identityLocks.name}
              silent={silentIdentity}
            />
          )}
        </h2>

        {subtitle}

        {presence.label && (
          <p className={`presence-line ${presence.online ? 'presence-line-online' : ''}`}>
            {presence.label}
          </p>
        )}

        {/* Tiles, not rows. As rows these sat on a fixed label lane holding a
            16px icon, so every value was stranded a hundred pixels from the
            thing naming it. A tile puts the label against its own value and
            lets the grid do the aligning. */}
        <dl className="hero-facts">
          {facts.map((def) => {
            const shown = displayValue(def, profile)
            // An unanswered fact is dropped on a match's profile but kept for
            // the owner, where the blank is the prompt to fill it in.
            if (!shown && !onSave) return null

            const Icon = iconFor(def.key)

            return (
              <div key={def.key} className="hero-fact">
                <dt className="hero-fact-label">
                  {Icon && <Icon className="hero-fact-icon" strokeWidth={1.7} aria-hidden="true" />}
                  {def.label}
                </dt>

                {onSave ? (
                  // The editor owns its own row markup, so it replaces the
                  // value rather than sitting beside it.
                  <EditableField
                    def={def}
                    profile={profile}
                    onSave={onSave}
                    bare
                    locked={lockFor(def.key)?.locked}
                    notice={noticeFor(def.key)}
                  />
                ) : (
                  <dd className="hero-fact-value">{shown}</dd>
                )}
              </div>
            )
          })}
        </dl>
      </div>

      {actions && <div className="profile-hero-actions">{actions}</div>}
    </section>
  )
}
