'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import ProfileDetails from '@/components/profile/ProfileDetails'
import ProfileHeader from '@/components/profile/ProfileHeader'
import { useAuth } from '@/components/authProvider'
import type { MyProfile } from '@/types/profile'

export default function MyProfilePage() {
  const router = useRouter()
  const auth = useAuth()

  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/profile/me')

        if (response.status === 401) {
          auth.loginRequiredRedirect()
          return
        }

        const data = await response.json().catch(() => ({}))
        if (cancelled) return

        if (!response.ok) {
          setError(data.detail ?? 'Could not load your profile.')
        } else {
          setProfile(data)
          auth.setProfileComplete(Boolean(data.is_complete))
        }
      } catch {
        if (!cancelled) setError('Network error. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-color-placeholder-text">Loading your profile…</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-red-600">{error || 'Profile unavailable.'}</p>
        <Link href="/" className="link mt-4 inline-block">Back to home</Link>
      </div>
    )
  }

  const completeness = profile.profile_completeness ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/40 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">

        <ProfileHeader
          profile={profile}
          actions={
            <>
              <Link href="/profile/register" className="btn bg-color-primary text-white">
                Edit profile
              </Link>
              {profile.profile_id && (
                <Link
                  href={`/profile/${profile.profile_id}`}
                  className="btn border border-color-border text-color-primary"
                >
                  View as public
                </Link>
              )}
            </>
          }
        />

        {/* Completeness nudge */}
        <div className="rounded-2xl border border-color-border bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">Profile completeness</p>
              <p className="text-sm text-color-placeholder-text">
                {profile.is_complete
                  ? 'Your profile is visible to matches.'
                  : 'Reach 95% to start appearing in match results.'}
              </p>
            </div>
            <span className="text-2xl font-bold text-color-primary">{completeness}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-pink-100">
            <div
              className="h-full rounded-full bg-color-primary transition-all duration-500"
              style={{ width: `${Math.min(completeness, 100)}%` }}
            />
          </div>
          {!profile.is_complete && (
            <button
              type="button"
              onClick={() => router.push('/profile/register')}
              className="btn-primary mt-4"
            >
              Finish my profile
            </button>
          )}
        </div>

        {/* Private contact block - never rendered on the public page */}
        <section className="form-section">
          <h3 className="form-section-title">Account &amp; contact</h3>
          <p className="form-section-hint">Only visible to you.</p>
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { label: 'Email', value: profile.email },
              { label: 'Phone', value: [profile.countryCode, profile.phone].filter(Boolean).join(' ') },
              { label: 'Profile created for', value: profile.profileFor },
              { label: 'Looking for', value: profile.lookingFor },
            ]
              .filter((r) => r.value)
              .map((row) => (
                <div key={row.label} className="flex justify-between gap-4 text-sm">
                  <dt className="text-color-placeholder-text">{row.label}</dt>
                  <dd className="font-medium capitalize text-gray-900">{row.value}</dd>
                </div>
              ))}
          </dl>
        </section>

        <ProfileDetails profile={profile} />
      </div>
    </div>
  )
}
