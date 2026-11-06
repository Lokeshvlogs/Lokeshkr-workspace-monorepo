'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { useBlock } from '@/hooks/useBlock'

interface BlockedRow {
  profileId: string
  name: string
  city: string
  photo: string | null
}

function toRow(raw: any): BlockedRow | null {
  const profile = raw?.profile ?? {}
  const profileId = String(profile?.profile_id ?? '')
  if (!profileId) return null

  return {
    profileId,
    name: [profile?.first_name, profile?.surname].filter(Boolean).join(' ') || 'A member',
    city: String(profile?.city ?? ''),
    photo: profile?.photo ?? null,
  }
}

/**
 * Blocked members, and the only way to undo a block.
 *
 * Blocking used to be permanent at every layer - no endpoint, and a read-only
 * admin - which made it a one-tap action with no way back. This is the way
 * back, and it is deliberately here rather than on a profile: the blocked
 * member no longer appears in matches or opens by URL, so there is nowhere
 * else it could live.
 */
export default function BlockedMembers() {
  const { unblock, busy } = useBlock()
  const [rows, setRows] = useState<BlockedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [pending, setPending] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/profile/blocks')
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setFailed(true)
        return
      }
      const list = Array.isArray(data?.results) ? data.results : []
      setRows(list.map(toRow).filter(Boolean) as BlockedRow[])
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const lift = async (profileId: string) => {
    setPending(profileId)
    if (await unblock(profileId)) {
      setRows((current) => current.filter((row) => row.profileId !== profileId))
    }
    setPending('')
  }

  return (
    <section className="settings-section mt-8">
      <div className="settings-row">
        <div className="min-w-0">
          <h2 className="settings-row-title">Blocked members</h2>
          <p className="settings-row-hint">
            {loading
              ? 'Checking…'
              : failed
                ? 'Could not load this list right now.'
                : rows.length === 0
                  ? 'You have not blocked anyone.'
                  : `${rows.length} ${rows.length === 1 ? 'member' : 'members'} cannot see you, or be seen by you.`}
          </p>
        </div>
      </div>

      {rows.length > 0 && (
        <ul className="settings-form flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.profileId} className="blocked-row">
              <div className="min-w-0">
                <p className="blocked-name">{row.name}</p>
                {row.city && <p className="blocked-city">{row.city}</p>}
              </div>
              <button
                type="button"
                className="chip chip-square shrink-0"
                onClick={() => lift(row.profileId)}
                disabled={busy && pending === row.profileId}
              >
                {busy && pending === row.profileId ? 'Working…' : 'Unblock'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
