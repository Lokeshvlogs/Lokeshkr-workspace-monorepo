'use client'

import React, { type ReactNode } from 'react'

import Avatar from '@/components/profile/Avatar'
import EditableField, { displayValue } from '@/components/profile/EditableField'
import { iconFor } from '@/lib/profileIcons'
import NameWithBadge from '@/components/profile/NameWithBadge'
import Link from 'next/link'

import { PROFILE_FIELDS } from '@/lib/profileFields'
import { heroTags, HERO_PLACE_KEY, type HeroTag } from '@/lib/heroTags'
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
 *
 * `bodyPhysique` and `manglikLevel` used to be here and are not any more. Note
 * that this was their ONLY render site - their section, `Basic Details`, is not
 * in `SECTIONS` - so they now appear nowhere on a profile. Their defs survive,
 * so the wizard still collects them.
 *
 * They are grouped rather than tiled now: who somebody is on one line, what
 * they do on the next, what they studied under that. A grid of identical
 * tinted boxes gave a birth date the same weight as a salary and left the
 * reader to do the sorting.
 *
 * `profession` and `salaryAmount` appear in the work line but are NOT facts -
 * they are hero tags, rendered as links so they still follow into search. They
 * stay in `HERO_TAG_KEYS` regardless, because that list is what withholds them
 * from the panels below; only their rendering forks. See the partition in the
 * component.
 */
const HERO_FACT_KEYS = ['age', 'height', 'maritalStatus', 'gender', 'dob'] as const

/**
 * Tiles only the owner sees.
 *
 * A reader does not need to be told a member's gender - matches are
 * opposite-gender by definition, and where it matters the managed-by line below
 * says it in a pronoun. The owner keeps the tile because this panel is the ONLY
 * place gender renders or can be edited inline: its section `Basic Details` is
 * not in `SECTIONS`, so there is no row to fall back to, and the identity-lock
 * warning about spending the last allowed change hangs off this editor.
 */
const OWNER_ONLY_FACTS: ReadonlySet<string> = new Set(['gender', 'dob'])

/**
 * Promoted fields that render as a line rather than as a pill.
 *
 * Not a different kind of thing from the tags - the same `heroTags()` builds
 * them, and because they stay in `HERO_TAG_KEYS` they stay in `PROMOTED_KEYS`,
 * so the panels below still withhold them. This set decides one thing only:
 * which skin `renderTag` paints. What somebody does and earns reads as a
 * statement about them; a row of six identical chips made everything look
 * equally shoutable.
 */
const LINE_TAG_IDS: ReadonlySet<string> = new Set(['profession', 'salaryAmount'])

/** Shown on a line of its own, under the work line. */
const EDUCATION_TAG_ID = 'educationLevel'

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
  /**
   * Turns the tags into links into search. Absent on your own profile, where a
   * tag opens its editor instead - one element cannot sensibly do both.
   */
  searchHref?: (filter: { param: string; value: string }) => string
  /** The About me block, rendered inside this panel rather than beside it. */
  bio?: ReactNode
  /**
   * Who runs this profile, as a credit under the bio.
   *
   * A finished string rather than the raw key, so this panel stays out of the
   * owner/visitor wording decision - the same way `subtitle` and `bio` work.
   */
  managed?: string
}

export default function ProfileHeroPanel({
  profile,
  onSave,
  actions,
  subtitle,
  identityLocks = {},
  silentIdentity = false,
  searchHref,
  bio,
  managed,
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

  /* `dob` is owner-only and never reaches a public payload, so on a match it
     simply has no value and drops out below. A line with nothing left in it is
     not rendered at all. */
  const facts = HERO_FACT_KEYS.filter((key) => onSave || !OWNER_ONLY_FACTS.has(key))
    .map((key) => PROFILE_FIELDS.find((f) => f.key === key))
    .filter((def): def is NonNullable<typeof def> => Boolean(def))
    .map((def) => ({ def, shown: displayValue(def, profile) }))
    /* A blank is dropped for a visitor and kept for the owner as the prompt to
       fill it in - except on a derived field, which has no editor to prompt
       with. `age` is the one: the server computes it from `dob`. */
    .filter(({ def, shown }) => shown || (onSave && def.editor !== 'readonly'))

  // `onSave` is the owner signal: it keeps blank tags on the page so there is
  // something to click the pencil on, since a promoted field has no row below.
  const allTags = heroTags(profile, { owner: Boolean(onSave) })
  // Rendered under the name rather than among the pills - see HERO_PLACE_KEY.
  const placeTag = allTags.find((tag) => tag.id === HERO_PLACE_KEY)
  /* What somebody does and earns reads as a statement about them, not as a
     filter chip - so these two render on the work line instead of in the pill
     row. They remain tags in every other sense: same `heroTags` plumbing, same
     search link, same inline editor for the owner. */
  const lineTags = allTags.filter((tag) => LINE_TAG_IDS.has(tag.id))
  const eduTag = allTags.find((tag) => tag.id === EDUCATION_TAG_ID)
  const pillTags = allTags.filter(
    (tag) => tag !== placeTag && tag !== eduTag && !LINE_TAG_IDS.has(tag.id),
  )

  /**
   * A tag: a link on someone else's profile, an editor on your own.
   *
   * Two looks, one set of rules. A `pill` is the rounded chip in the row below;
   * a `line` is plain text that happens to be clickable, for the facts that
   * read as a statement about a person rather than as a filter - what they do,
   * what they earn. The decision of WHAT to render is made once here; only the
   * wrapper differs, which is why this takes a variant rather than existing
   * twice.
   */
  const renderTag = (tag: HeroTag, variant: 'pill' | 'line' = 'pill') => {
    const line = variant === 'line'
    const Icon = tag.icon
    const glyph = Icon ? (
      <Icon
        className={line ? 'hero-line-icon' : 'hero-tag-icon'}
        strokeWidth={1.8}
        aria-hidden="true"
      />
    ) : null

    const editable = Boolean(onSave && tag.def)
    // Computed tags (NRI, residency) have no def and no filter, so on the
    // owner's own page they stay plain text rather than becoming a search for
    // people like themselves.
    const followable = Boolean(searchHref && tag.filter && !editable)

    if (line) {
      /* A line item lives inside the <dl> its group renders, so the label is a
         real <dt> and the value a real <dd> - the same term/definition pairing
         the facts beside it use. */
      return (
        <div key={tag.id} className="hero-line-item" title={tag.title}>
          {glyph}
          <dt className="sr-only">{tag.srLabel}</dt>
          {editable ? (
            <EditableField def={tag.def!} profile={profile} onSave={onSave!} bare />
          ) : followable ? (
            <dd className="hero-fact-value">
              <Link href={searchHref!(tag.filter!)} className="hero-line-link">
                {tag.label}
              </Link>
            </dd>
          ) : (
            <dd className="hero-fact-value">{tag.label}</dd>
          )}
        </div>
      )
    }

    if (editable) {
      return (
        <li key={tag.id} className="hero-tag hero-tag-editable">
          {glyph}
          <span className="sr-only">{tag.srLabel}</span>
          <EditableField def={tag.def!} profile={profile} onSave={onSave!} bare />
        </li>
      )
    }

    if (!followable) {
      return (
        <li key={tag.id} className="hero-tag" title={tag.title}>
          {glyph}
          <span className="sr-only">{tag.srLabel}</span>
          {tag.label}
        </li>
      )
    }

    return (
      <li key={tag.id}>
        <Link href={searchHref!(tag.filter!)} className="hero-tag hero-tag-link" title={tag.title}>
          {glyph}
          <span className="sr-only">{tag.srLabel}</span>
          {tag.label}
        </Link>
      </li>
    )
  }

  return (
    <section className="profile-hero">
      <div className="profile-hero-top">
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

        {/* Straight after the profile id. It goes through the same `renderTag` as the row below, so
            a visitor still gets a link into search and the owner still gets an
            editor - the two behaviours the call sites already choose between by
            passing `searchHref` or `onSave`. */}
        {placeTag && <ul className="hero-place">{renderTag(placeTag)}</ul>}

        {presence.label && (
          <p className={`presence-line ${presence.online ? 'presence-line-online' : ''}`}>
            {presence.label}
          </p>
        )}

        {/* Three groups, not a grid of tinted tiles. Identical pink boxes gave
            a birth date the same weight as a salary and left the reader to do
            the sorting; grouped lines say which facts belong together.

            Who they are, then what they do, then what they studied. */}
        {facts.length > 0 && (
          <dl className="hero-line hero-line-identity">
            {facts.map(({ def, shown }) => (
              <div key={def.key} className="hero-line-item">
                {/* Visually hidden, never dropped: a screen reader still hears
                    "Age, 28 yrs" rather than a bare run of numbers. */}
                <dt className="sr-only">{def.label}</dt>

                {/* The same `readonly` guard `ProfileDetails` applies: a
                    derived value gets no pencil even for the owner, because the
                    wizard step that computes it would overwrite an inline edit
                    on its next save. Without it `age` opens an editor with no
                    control in it. */}
                {onSave && def.editor !== 'readonly' ? (
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
            ))}
          </dl>
        )}

        {lineTags.length > 0 && (
          <dl className="hero-line hero-line-work">
            {lineTags.map((tag) => renderTag(tag, 'line'))}
          </dl>
        )}

        {eduTag && (
          <dl className="hero-line hero-line-study">{renderTag(eduTag, 'line')}</dl>
        )}

        {pillTags.length > 0 && (
          <ul className="hero-tags">{pillTags.map((tag) => renderTag(tag))}</ul>
        )}
      </div>

      {actions && <div className="profile-hero-actions">{actions}</div>}
      </div>

      {/* Inside the panel, not a card of its own. The bio is the one thing on
          the page written in the member's own words, and it belongs with their
          face rather than below a row of other cards.

          Gated on either, not on `bio`: an empty About me is common, and the
          managed-by credit still has to appear - the top rule then reads as a
          footer rule, which is what it is. */}
      {(bio || managed) && (
        <div className="profile-hero-bio">
          {bio}
          {managed && (
            <p className="hero-managed-by">
              {/* The em dash is gone with the plain text: it was how a
                  run of italics said "this is a credit, not a sentence",
                  and inside a pill it reads as a typo. */}
              <span className="managed-by">{managed}</span>
            </p>
          )}
        </div>
      )}
    </section>
  )
}
