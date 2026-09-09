'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import Avatar from '@/components/profile/Avatar'
import { relativeTime } from '@/lib/presence'
import { profileHref } from '@/lib/navigation'
import { toInterestRow, type InterestRow } from '@/lib/interests'

interface FeedItem {
  key: string
  profileId: string
  name: string
  photo: string | null
  text: string
  at: string
}

interface Visitor {
  profileId: string
  name: string
  photo: string | null
  lastSeen: string | null
  visits?: number
  isRepeat?: boolean
}

/**
 * What has actually happened, newest first.
 *
 * The cards above count things; this is the only place on the dashboard where
 * something *arrived*. Merged client-side from three lists that already exist -
 * no new endpoint - and every row is a way through to the person.
 */
export default function ActivityFeed() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [received, setReceived] = useState<InterestRow[]>([])
  const [accepted, setAccepted] = useState<InterestRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const json = (url: string) => fetch(url).then((r) => r.json()).catch(() => null)

    Promise.all([
      json('/api/profile/visitors'),
      json('/api/interests?tab=received'),
      json('/api/interests?tab=accepted'),
    ]).then(([v, r, a]) => {
      if (cancelled) return
      setVisitors(Array.isArray(v) ? v : [])
      setReceived(Array.isArray(r?.results) ? r.results : [])
      setAccepted(Array.isArray(a?.results) ? a.results : [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo(() => {
    const rows: FeedItem[] = []

    for (const v of visitors) {
      if (!v.lastSeen) continue
      rows.push({
        key: `v-${v.profileId}`,
        profileId: v.profileId,
        name: v.name || 'Someone',
        photo: v.photo,
        // A returning visitor is a stronger signal than a first look, and
        // saying so is the whole value of the row.
        text: v.isRepeat ? `viewed your profile ${v.visits} times` : 'viewed your profile',
        at: v.lastSeen,
      })
    }

    for (const row of received) {
      rows.push({
        key: `i-${row.id}`,
        profileId: row.profile.profileId,
        name: row.profile.name || 'Someone',
        photo: row.profile.photo,
        text: 'sent you an interest',
        at: row.createdAt,
      })
    }

    for (const row of accepted) {
      rows.push({
        key: `a-${row.id}`,
        profileId: row.profile.profileId,
        name: row.profile.name || 'Someone',
        photo: row.profile.photo,
        text: row.direction === 'sent' ? 'accepted your interest' : 'is a mutual match',
        at: row.respondedAt || row.createdAt,
      })
    }

    return rows
      .filter((row) => row.profileId && row.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8)
  }, [visitors, received, accepted])

  return (
    <section className="panel">
      <h2 className="panel-title">Recent activity</h2>

      {loading ? (
        <div className="panel-skeleton-rows" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : items.length === 0 ? (
        <p className="panel-empty">
          Nothing yet. Once people start viewing your profile and expressing interest, it shows
          up here.
        </p>
      ) : (
        <ul className="feed-list">
          {items.map((item) => (
            <li key={item.key}>
              <Link href={profileHref(item.profileId, '/')} className="feed-row">
                <Avatar
                  src={item.photo}
                  name={item.name}
                  className="feed-avatar"
                  decorative
                />
                <span className="min-w-0 flex-1">
                  <span className="feed-text">
                    <strong>{item.name}</strong> {item.text}
                  </span>
                  <span className="feed-time">{relativeTime(item.at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
