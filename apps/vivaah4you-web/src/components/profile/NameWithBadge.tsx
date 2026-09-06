'use client'

import React, { type ReactNode } from 'react'
import { VerifiedBadge } from '@lokesh-workspace/ui'

import { VerificationLevel } from '@/types/profile'

interface Props {
  name: string
  /** Absent on payloads that predate verification; treated as unverified. */
  level?: VerificationLevel | number
  size?: 'sm' | 'md' | 'lg'
  /** Wrapper element class, e.g. `profile-hero-name` or `card-name`. */
  className?: string
  /** Rendered after the badge, e.g. the age that follows a name. */
  children?: ReactNode
}

/**
 * A member's name followed by their verification mark, if they have earned one.
 *
 * `VerifiedBadge` renders nothing below COMPLETE, so this is safe to use for
 * every name in the app without checking first.
 */
export default function NameWithBadge({
  name,
  level = VerificationLevel.None,
  size = 'md',
  className,
  children,
}: Props) {
  return (
    <span className={className}>
      {name}
      <VerifiedBadge level={level as 0 | 1 | 2 | 3} size={size} />
      {children}
    </span>
  )
}
