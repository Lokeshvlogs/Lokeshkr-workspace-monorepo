'use client'

import React, { Suspense } from 'react'

import MatchesSection from '@/components/profile/MatchesSection'

/**
 * The matches grid, on its own route.
 *
 * It used to be the dashboard's default centre view, kept permanently mounted
 * behind a `hidden` class so its filters survived opening a profile. On a real
 * route it unmounts, so the filters live in the URL instead - which restores
 * them on Back for free and makes a filtered search shareable.
 */
export default function MatchesPage() {
  return (
    <div className="page-shell">
      <h1 className="page-title">Matches</h1>
      <Suspense fallback={<div className="panel-skeleton" aria-hidden="true" />}>
        <MatchesSection />
      </Suspense>
    </div>
  )
}
