'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

import ProfileCard, { type ProfileCardData } from '@/components/profile/ProfileCard'
import { useAuth } from '@/components/authProvider'
import { fullName, labelFor, locationLabel } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

/**
 * Placeholder cards shown until there are enough real members to match against.
 * Replaced automatically once /api/profile/matches returns results.
 */
const SAMPLE_PROFILES: ProfileCardData[] = [
  {
    name: 'Ananya',
    age: 27,
    location: 'Bengaluru, India',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=1',
    headline: 'Sample profile',
  },
  {
    name: 'Rohit',
    age: 30,
    location: 'Mumbai, India',
    image: 'https://easy-peasy.ai/cdn-cgi/image/quality=95,format=auto,width=800/https://media.easy-peasy.ai/27feb2bb-aeb4-4a83-9fb6-8f3f2a15885e/98cef342-430c-4522-8fa6-106d93297351.png',
    headline: 'Sample profile',
  },
  {
    name: 'Priya',
    age: 26,
    location: 'Delhi, India',
    image: 'https://shoutoutla.s3.us-west-1.amazonaws.com/wp-content/uploads/2021/05/c-PersonalAvniBarman__IMG5900_1616723337432.jpg',
    headline: 'Sample profile',
  },
  {
    name: 'Amit',
    age: 32,
    location: 'Chennai, India',
    image: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=4',
    headline: 'Sample profile',
  },
]

const toCard = (profile: PublicProfile): ProfileCardData => ({
  profileId: profile.profile_id,
  name: fullName(profile) || 'Vivah4U member',
  age: profile.age,
  location: locationLabel(profile),
  image: profile.photo,
  headline: [labelFor('profession', profile.profession), labelFor('community', profile.community)]
    .filter(Boolean)
    .join(' · '),
})

export default function MatchesSection() {
  const auth = useAuth()
  const [matches, setMatches] = useState<ProfileCardData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!auth.isAuthenticated) return

    let cancelled = false
    setLoading(true)

    fetch('/api/profile/matches')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return
        setMatches(data.map(toCard))
      })
      .catch(() => {
        // Fall back to the sample cards below.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [auth.isAuthenticated])

  const hasMatches = matches.length > 0
  const cards = hasMatches ? matches : SAMPLE_PROFILES

  return (
    <section id="profiles" className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-bold">
          {auth.isAuthenticated ? 'Matches for you' : 'Featured Profiles'}
        </h2>
        {auth.isAuthenticated && !auth.isProfileComplete && (
          <Link href="/profile/register" className="link text-sm">
            Complete your profile to improve matches →
          </Link>
        )}
      </div>

      {auth.isAuthenticated && !hasMatches && !loading && (
        <p className="mt-2 text-sm text-color-placeholder-text">
          No matches yet — showing sample profiles while the community grows.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <ProfileCard key={card.profileId ?? card.name} {...card} />
        ))}
      </div>
    </section>
  )
}
