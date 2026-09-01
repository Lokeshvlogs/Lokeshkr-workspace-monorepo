'use client'

import React from 'react'
import Link from 'next/link'

export type ProfileCardData = {
  /** Present for real profiles; absent for the sample/placeholder cards. */
  profileId?: string
  name: string
  age: number | null
  location: string
  image: string | null
  headline?: string
  /** Secondary facts (height, religion, community, language), shown as pills. */
  details?: string[]
  /** Gallery size, surfaced as a small count over the photo. */
  photoCount?: number
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
  details = [],
  photoCount = 0,
}: ProfileCardData) {
  const href = profileId ? `/profile/${profileId}` : undefined
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
        <p className="card-name">
          {name}
          {age ? <span className="card-age">{age}</span> : null}
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
      {href ? (
        <Link href={href} aria-label={`View ${name}'s profile`} className="card-media-link">
          {media}
        </Link>
      ) : (
        media
      )}

      <div className="card-body">
        {headline && <p className="card-headline">{headline}</p>}

        {shown.length > 0 && (
          <ul className="card-pills">
            {shown.map((detail) => (
              <li key={detail} className="card-pill">{detail}</li>
            ))}
            {extra > 0 && <li className="card-pill card-pill-more">+{extra}</li>}
          </ul>
        )}

        {href ? (
          <Link href={href} className="card-cta">View profile</Link>
        ) : (
          <button type="button" className="card-cta">Connect</button>
        )}
      </div>
    </article>
  )
}
