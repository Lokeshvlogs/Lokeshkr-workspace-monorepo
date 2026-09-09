'use client'

import React from 'react'

interface Props {
  src: string | null | undefined
  /** Used for the initial fallback and the alt text. */
  name: string
  /** The call site's own class, e.g. `profile-hero-avatar` or `welcome-avatar`. */
  className: string
  /**
   * Suffix appended to `className` for the letter fallback, matching the
   * existing `-initial` convention.
   */
  initialClassName?: string
  /** Decorative next to a visible name; alt is dropped when true. */
  decorative?: boolean
}

/**
 * A member's picture, or their initial when there isn't one.
 *
 * This branch was written out five separate times - twice identically in the
 * two profile-hero views, plus the match card, the welcome band, the visitor
 * list and a hand-rolled one in the public profile header - each carrying its own copy of
 * the eslint-disable below. Each call site keeps passing its existing class, so
 * this renders exactly what it replaced.
 */
export default function Avatar({
  src,
  name,
  className,
  initialClassName,
  decorative = false,
}: Props) {
  if (src) {
    return (
      // Avatars are user uploads and remote URLs of unknown dimensions, which
      // is what next/image wants declared up front.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={decorative ? '' : name} className={className} />
    )
  }

  const initial = (name || '?').charAt(0).toUpperCase()
  const fallback = initialClassName ?? `${className}-initial`

  return (
    <span className={`${className} ${fallback}`} aria-hidden="true">
      {initial}
    </span>
  )
}
