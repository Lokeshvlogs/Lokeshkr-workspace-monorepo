'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import MyProfileView from '@/components/home/MyProfileView'
import { useAuth } from '@/components/authProvider'
import type { MyProfile } from '@/types/profile'

/**
 * Your own profile, editable.
 *
 * Was a redirect to `/?view=me` while the dashboard owned every view. Now that
 * each destination has a route, this is the destination.
 */
export default function MyProfilePage() {
  const auth = useAuth()
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const data = await fetch('/api/profile/me')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    if (!auth.isReady) return
    if (!auth.isAuthenticated) {
      auth.loginRequiredRedirect()
      return
    }
    load().finally(() => setLoading(false))
  }, [auth.isReady, auth.isAuthenticated, load])

  /**
   * Persists one inline edit.
   *
   * Re-reads rather than trusting the local patch: the server normalises
   * values, and the completeness ring above has to move with them.
   */
  const saveField = useCallback(
    async (step: number, patch: Record<string, unknown>) => {
      const response = await fetch('/api/profile/save-step', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, ...patch }),
      }).catch(() => null)

      if (!response) return false
      if (response.status === 401) {
        auth.loginRequiredRedirect()
        return false
      }
      if (!response.ok) return false

      const data = await load()
      if (data) auth.setProfileComplete(Boolean(data.is_complete))
      return true
    },
    [auth, load],
  )

  if (loading) {
    return (
      <div className="page-shell">
        <div className="panel-skeleton" aria-hidden="true" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="page-shell">
        <div className="center-error">
          <p className="match-empty-title">Could not load your profile</p>
          <p className="match-empty-text">Check your connection and try again.</p>
          <Link href="/" className="btn-primary mt-4 inline-block">Back to dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <MyProfileView profile={profile} onSave={saveField} />
    </div>
  )
}
