'use client'

import React, { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'

import Avatar from '@/components/profile/Avatar'
import TabStrip from '@/components/common/TabStrip'
import { profileHref } from '@/lib/navigation'
import NameWithBadge from '@/components/profile/NameWithBadge'
import { presenceFor } from '@/lib/presence'
import {
  EMPTY_COUNTS,
  INTEREST_TABS,
  TAB_LABEL,
  type InterestCounts,
  type InterestRow,
  type InterestTab,
} from '@/lib/interests'

const EMPTY_TEXT: Record<InterestTab, string> = {
  received: 'Nobody has expressed interest yet. A complete profile with a photo gets far more.',
  sent: 'You have not expressed interest in anyone yet.',
  accepted: 'Nothing mutual yet. An interest becomes mutual when the other side accepts.',
  declined: 'Nothing here. Interests you sent that were declined would appear in this list.',
}

interface Props {
  /** Lets a parent refresh its badge after an accept or decline. */
  onCountsChange?: (counts: InterestCounts) => void
}

export default function InterestsView({ onCountsChange }: Props = {}) {
  const [tab, setTab] = useState<InterestTab>('received')
  const [rows, setRows] = useState<InterestRow[]>([])
  const [counts, setCounts] = useState<InterestCounts>(EMPTY_COUNTS)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  const loadCounts = useCallback(async () => {
    const next = await fetch('/api/interests/counts')
      .then((r) => r.json())
      .catch(() => EMPTY_COUNTS)
    setCounts(next)
    onCountsChange?.(next)
  }, [onCountsChange])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(`/api/interests?tab=${tab}`)
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

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  // Opening the received tab clears the dot but leaves the outstanding count
  // alone - those are different questions and the badge is the one that should
  // go quiet once you have looked.
  useEffect(() => {
    if (tab !== 'received') return
    fetch('/api/interests/mark-seen', { method: 'POST' })
      .then(() => loadCounts())
      .catch(() => {})
  }, [tab, loadCounts])

  const act = async (id: number, action: 'accept' | 'decline' | 'withdraw') => {
    setBusyId(id)
    try {
      const response = await fetch(`/api/interests/${id}/${action}`, { method: 'POST' })
      if (response.ok) {
        // Drop the row rather than refetching: every action moves it out of the
        // tab it was in, so the list is already right.
        setRows((current) => current.filter((row) => row.id !== id))
        await loadCounts()
      }
    } finally {
      setBusyId(null)
    }
  }

  const tabCount = (key: InterestTab) =>
    key === 'received'
      ? counts.receivedPending
      : key === 'sent'
        ? counts.sentPending
        : key === 'accepted'
          ? counts.accepted
          : counts.declined

  return (
    <section className="flex flex-col gap-5">
      <TabStrip
        tabs={INTEREST_TABS.map((key) => ({
          key,
          label: TAB_LABEL[key],
          count: tabCount(key),
          dot: key === 'received' && counts.receivedUnseen > 0,
        }))}
        active={tab}
        onChange={setTab}
        label="Interests"
      />

      {loading ? (
        <div className="panel-skeleton" aria-hidden="true" />
      ) : rows.length === 0 ? (
        <div className="match-empty">
          <p className="match-empty-title">Nothing here yet</p>
          <p className="match-empty-text">{EMPTY_TEXT[tab]}</p>
        </div>
      ) : (
        <ul className="interest-list">
          {rows.map((row) => {
            const person = row.profile
            const presence = presenceFor(person.presence)
            const name = person.name || 'Vivah4U member'

            return (
              <li key={row.id} className="interest-row">
                {/* A real link, not a button: profiles have their own route
                    now, and ctrl-click did nothing here before. */}
                <Link href={profileHref(person.profileId, '/interests')} className="interest-person">
                  <span className="interest-portrait">
                    <Avatar src={person.photo} name={name} className="interest-avatar" decorative />
                    {presence.online && <span className="presence-dot presence-dot-online" />}
                  </span>
                  <span className="min-w-0">
                    <NameWithBadge
                      name={name}
                      level={person.verificationLevel}
                      className="interest-name"
                    />
                    <span className="interest-meta">
                      {[person.age ? `${person.age} yrs` : '', person.city, presence.label]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    {row.message && <span className="interest-message">“{row.message}”</span>}
                  </span>
                </Link>

                <div className="interest-actions">
                  {row.direction === 'received' && row.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="chip chip-square"
                        disabled={busyId === row.id}
                        onClick={() => act(row.id, 'decline')}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="chip chip-selected chip-square"
                        disabled={busyId === row.id}
                        onClick={() => act(row.id, 'accept')}
                      >
                        Accept
                      </button>
                    </>
                  )}

                  {row.direction === 'sent' && row.status === 'pending' && (
                    <button
                      type="button"
                      className="chip chip-square"
                      disabled={busyId === row.id}
                      onClick={() => act(row.id, 'withdraw')}
                    >
                      Withdraw
                    </button>
                  )}

                  {row.status === 'accepted' && <span className="interest-badge">Mutual</span>}
                  {row.status === 'declined' && (
                    <span className="interest-badge interest-badge-quiet">Declined</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
