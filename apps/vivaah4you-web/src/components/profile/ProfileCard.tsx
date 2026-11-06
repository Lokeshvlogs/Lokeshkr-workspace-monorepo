'use client'

import React from 'react'
import Link from 'next/link'

import NameWithBadge from '@/components/profile/NameWithBadge'
import InterestButton from '@/components/profile/InterestButton'
import SaveButton from '@/components/profile/SaveButton'
import { profileHref } from '@/lib/navigation'
import type { ConnectionState } from '@/lib/interests'
import { iconFor } from '@/lib/profileIcons'

/* Resolved once, at module level: the same glyphs the profile page puts on
   these facts, so a card and the profile it opens agree. `settleAbroad` is the
   plane heroTags() already uses for its NRI tag. */
const ProfessionIcon = iconFor('profession')
const HeightIcon = iconFor('height')
const EducationIcon = iconFor('educationLevel')
const SalaryIcon = iconFor('salaryAmount')
const NriIcon = iconFor('settleAbroad')

export type ProfileCardData = {
  /** Present for real profiles; absent for the sample/placeholder cards. */
  profileId?: string
  name: string
  age: number | null
  location: string
  image: string | null
  headline?: string
  /** Highest qualification, already label-resolved. */
  education?: string
  /** Annual income, already label-resolved from its bucket (e.g. "25-50 lacs"). */
  salary?: string
  /** Already formatted in prime marks (`5'8"`); rides beside the profession. */
  height?: string
  /** Faith, already label-resolved. Leads the third fact row. */
  religion?: string
  /** Caste/community, already label-resolved. Shares that row with the faith. */
  community?: string
  /**
   * Whether this member lives abroad. Computed by the API
   * (`apps/profiles/residency.py`) and only read here - the `nri` search filter
   * applies the same test, and a second copy of the rule would drift from it.
   */
  isNri?: boolean
  /** Secondary facts (religion, community), shown as pills. */
  details?: string[]
  /** Gallery size, surfaced as a small count over the photo. */
  photoCount?: number
  /** Drives the verification mark beside the name. */
  verificationLevel?: number
  /**
   * The list this card is in, carried into the profile so its Back button can
   * return here. Absent on the signed-out marketing page.
   */
  from?: string
  /** Whether the viewer has already saved this member. Seeded by the grid. */
  isSaved?: boolean
  /** Where the viewer stands with this member, seeded by the grid. */
  connection?: ConnectionState
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="card-pin" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export default function ProfileCard({
  profileId,
  name,
  age,
  location,
  image,
  headline,
  education,
  salary,
  height,
  religion,
  community,
  isNri = false,
  details = [],
  photoCount = 0,
  verificationLevel = 0,
  from,
  isSaved = false,
  connection,
}: ProfileCardData) {
  /* A plain link now. Profiles used to open in place in the dashboard, which
     meant intercepting left-clicks and letting modifier-clicks through; with a
     profile on its own route there is nothing to intercept. */
  const href = profileId ? profileHref(profileId, from) : undefined
  // Two pills read as a tidy row; more than that turns the card into a list.
  const shown = details.slice(0, 3)
  const extra = details.length - shown.length

  const media = (
    <div className={`card-media ${image ? "" : "card-media-empty"}`}>
      {image ? (
        // Avatars come from remote hosts or user uploads of unknown size.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="card-img" loading="lazy" />
      ) : (
        <div className="card-initial" aria-hidden="true">
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      {isNri && (
        <span className="card-nri" aria-label="Living abroad">
          {NriIcon && <NriIcon strokeWidth={2} aria-hidden="true" />}
          NRI
        </span>
      )}

      {photoCount > 1 && (
        <span className="card-photo-count" aria-label={`${photoCount} photos`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="m5 17 5-5 4 4 2-2 3 3" />
          </svg>
          {photoCount}
        </span>
      )}

      {/* Name sits on the photo behind a gradient rather than a floating chip,
          so it stays legible over a light image without hiding it. */}
      <div className="card-scrim">
        <p>
          <NameWithBadge name={name} level={verificationLevel} size="sm" className="card-name">
            {age ? <span className="card-age">{age}</span> : null}
          </NameWithBadge>
        </p>
        {location && (
          <p className="card-location">
            <PinIcon />
            <span className="truncate">{location}</span>
          </p>
        )}
      </div>
    </div>
  )

  return (
    <article className="card">
      {media}

      {/* One link, stretched over the whole card, instead of a "View profile"
          button: the card IS the link now. An overlay rather than a wrapper
          because the action row below holds <button>s, which may not sit inside
          an <a> - and a second link over the photo would give a screen reader
          the same destination twice. */}
      {href && (
        <Link href={href} className="card-stretch" aria-label={`View ${name}'s profile`} />
      )}

      <div className="card-body">
        {/* Profession leads, height rides on the right. Height was a pill
            before, where it sat among religion and community saying nothing
            about which fact it was; three words wide and never truncating, it
            costs this row almost nothing. */}
        {(headline || height) && (
          <div className="card-headline-row">
            {headline && (
              <p className="card-headline" title={headline}>
                {ProfessionIcon && (
                  <ProfessionIcon className="card-fact-icon" strokeWidth={1.8} aria-hidden="true" />
                )}
                <span className="truncate">{headline}</span>
              </p>
            )}
            {height && (
              <p className="card-height" aria-label="Height">
                {HeightIcon && (
                  <HeightIcon className="card-fact-icon" strokeWidth={1.8} aria-hidden="true" />
                )}
                {height}
              </p>
            )}
          </div>
        )}

        {/* Income and education pair off on the line below: both are short,
            both are what the search bar filters on, and neither needs the full
            width the profession above them does. */}
        {(salary || education) && (
          <div className="card-facts">
            {salary && (
              <p className="card-salary" aria-label="Annual income" title={salary}>
                {SalaryIcon && (
                  <SalaryIcon className="card-salary-icon" strokeWidth={1.8} aria-hidden="true" />
                )}
                {salary}
              </p>
            )}
            {education && (
              <p className="card-fact" aria-label="Education" title={education}>
                {EducationIcon && (
                  <EducationIcon className="card-fact-icon" strokeWidth={1.8} aria-hidden="true" />
                )}
                <span className="truncate">{education}</span>
              </p>
            )}
          </div>
        )}

        {/* Faith and community, as pills. They are passed as named props
            rather than folded into `details` so the community can be capped -
            it is the only one long enough to push the pair onto two rows. */}
        {(religion || community || shown.length > 0) && (
          <ul className="card-pills">
            {religion && <li className="card-pill">{religion}</li>}
            {community && (
              <li className="card-pill card-pill-shrink" title={community}>{community}</li>
            )}
            {shown.map((detail) => (
              <li key={detail} className="card-pill">{detail}</li>
            ))}
            {extra > 0 && <li className="card-pill card-pill-more">+{extra}</li>}
          </ul>
        )}

        {profileId ? (
          <div className="card-actions">
            <SaveButton profileId={profileId} initialSaved={isSaved} />
            <InterestButton profileId={profileId} variant="card" connection={connection} />
          </div>
        ) : (
          // Sample cards on the signed-out home page have no profile behind
          // them, so there is nobody to connect with.
          <button type="button" className="card-cta" disabled>Connect</button>
        )}
      </div>
    </article>
  )
}
