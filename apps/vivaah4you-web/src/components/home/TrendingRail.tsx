'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

import Avatar from '@/components/profile/Avatar'
import { presenceFor } from '@/lib/presence'
import { profileHref } from '@/lib/navigation'
import { fullName, labelFor, locationLabel } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

const TABS = [
  { key: 'trending', label: 'Trending', glyph: '🔥' },
  { key: 'online', label: 'Online now', glyph: '●' },
  { key: 'new', label: 'Just joined', glyph: '✨' },
] as const

type TrendingTab = (typeof TABS)[number]['key']

const EMPTY_TEXT: Record<TrendingTab, string> = {
  trending: 'Nothing trending yet — check back once more members are browsing.',
  online: 'Nobody from your matches is online right now.',
  new: 'No new members this week.',
}

/**
 * A rail of profiles worth a look right now.
 *
 * Deliberately a different shape from the grid below it: portrait cards on a
 * horizontal track, so it reads as a suggestion to browse rather than another
 * page of results. Every tab is a real signal - most viewed, actually online,
 * genuinely new - because a rail that quietly promotes whoever we like is the
 * thing members learn to scroll past.
 */
export default function TrendingRail({ from = '/' }: { from?: string }) {
  const [tab, setTab] = useState<TrendingTab>('trending')
  const [rows, setRows] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(`/api/profile/trending?tab=${tab}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setRows(Array.isArray(data?.results) ? data.results : [])
      })
      .catch(() => {
        if (!cancelled) setRows([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tab])

  return (
    <section className="rail">
      <div className="rail-head">
        <h2 className="rail-title">Worth a look</h2>

        <div className="rail-chips" role="group" aria-label="What to show">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              aria-pressed={tab === entry.key}
              onClick={() => setTab(entry.key)}
              className={`chip chip-square ${tab === entry.key ? 'chip-selected' : ''}`}
            >
              <span aria-hidden="true">{entry.glyph}</span>
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rail-track" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="rail-card rail-card-loading" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="rail-empty">{EMPTY_TEXT[tab]}</p>
      ) : (
        <div className="rail-track">
          {rows.map((profile, index) => {
            const presence = presenceFor(profile.presence)
            const name = profile.firstName || fullName(profile) || 'Member'

            return (
              <Link
                key={profile.profile_id}
                href={profileHref(profile.profile_id, from)}
                className="rail-card"
                /* Staggered so the rail arrives as a sweep rather than a
                   dozen cards appearing at once. */
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              >
                <span className="rail-card-media">
                  <Avatar src={profile.photo} name={name} className="rail-card-photo" decorative />
                  {presence.online && (
                    <span className="rail-live">
                      <span className="rail-live-dot" aria-hidden="true" />
                      Online
                    </span>
                  )}
                </span>

                <span className="rail-card-body">
                  <span className="rail-card-name">
                    {name}
                    {profile.age ? <span className="rail-card-age">{profile.age}</span> : null}
                  </span>
                  <span className="rail-card-meta">
                    {[labelFor('profession', profile.profession), locationLabel(profile)]
                      .filter(Boolean)
                      .join(' · ') || 'Vivah4U member'}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
