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
}

export default function ProfileCard({ profileId, name, age, location, image, headline }: ProfileCardData) {
  const href = profileId ? `/profile/${profileId}` : undefined

  const media = (
    <div className="relative h-56 w-full overflow-hidden rounded-lg bg-pink-50">
      {image ? (
        // Avatars come from remote hosts or user uploads of unknown size.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-color-primary">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="absolute bottom-3 left-3 rounded-md bg-white/80 px-3 py-1 backdrop-blur-md">
        <div className="text-sm font-semibold">
          {name}
          {age ? <span className="font-normal">, {age}</span> : null}
        </div>
        {location && <div className="text-xs text-gray-600">{location}</div>}
      </div>
    </div>
  )

  return (
    <div className="card-flashy p-4">
      {href ? <Link href={href} aria-label={`View ${name}'s profile`}>{media}</Link> : media}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-w-0 truncate text-sm text-gray-700">
          {headline || 'Open to meetings · Verified'}
        </div>
        {href ? (
          <Link href={href} className="btn bg-color-primary text-white shrink-0">View</Link>
        ) : (
          <button type="button" className="btn bg-color-primary text-white shrink-0">Connect</button>
        )}
      </div>
    </div>
  )
}
