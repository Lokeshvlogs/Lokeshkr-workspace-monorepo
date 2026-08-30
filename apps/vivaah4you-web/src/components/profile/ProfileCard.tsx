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
}

export default function ProfileCard({
  profileId,
  name,
  age,
  location,
  image,
  headline,
  details = [],
}: ProfileCardData) {
  const href = profileId ? `/profile/${profileId}` : undefined

  const media = (
    <div className="match-card-media">
      {image ? (
        // Avatars come from remote hosts or user uploads of unknown size.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="match-card-img" loading="lazy" />
      ) : (
        <div className="match-card-initial" aria-hidden="true">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      {/* Name and age sit on the image behind a gradient rather than a floating
          chip, so they stay legible over a light photo without hiding it. */}
      <div className="match-card-scrim">
        <div className="match-card-name">
          {name}
          {age ? <span className="match-card-age">, {age}</span> : null}
        </div>
        {location && <div className="match-card-location">{location}</div>}
      </div>
    </div>
  )

  return (
    <article className="match-card">
      {href ? (
        <Link href={href} aria-label={`View ${name}'s profile`} className="match-card-link">
          {media}
        </Link>
      ) : (
        media
      )}

      <div className="match-card-body">
        {headline && <p className="match-card-headline">{headline}</p>}

        {details.length > 0 && (
          <ul className="match-card-details">
            {details.map((detail) => (
              <li key={detail} className="match-card-pill">
                {detail}
              </li>
            ))}
          </ul>
        )}

        {href ? (
          <Link href={href} className="btn-primary match-card-cta">
            View profile
          </Link>
        ) : (
          <button type="button" className="btn-primary match-card-cta">
            Connect
          </button>
        )}
      </div>
    </article>
  )
}
