'use client'

import React from 'react'

export interface TabDef<K extends string> {
  key: K
  label: string
  /** Shown as a pill on the tab. Omitted or 0 renders nothing. */
  count?: number
  /** A red dot for "some of this is new", separate from the count. */
  dot?: boolean
}

interface Props<K extends string> {
  tabs: readonly TabDef<K>[]
  active: K
  onChange: (key: K) => void
  /** Names the tablist for screen readers - "Match lists", "Interests". */
  label: string
}

/**
 * The tab strip shared by matches, interests and visitors.
 *
 * Extracted because the same fifteen lines had been pasted into two components
 * and were about to be pasted into a third. The count and the dot are separate
 * inputs on purpose: the count says how much is outstanding and persists until
 * it is dealt with, the dot says some of it is new and clears on sight.
 */
export default function TabStrip<K extends string>({ tabs, active, onChange, label }: Props<K>) {
  return (
    <div className="match-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`match-tab ${active === tab.key ? 'match-tab-active' : ''}`}
        >
          {tab.label}
          {Boolean(tab.count) && <span className="match-tab-badge">{tab.count}</span>}
          {tab.dot && <span className="match-tab-dot" aria-label="New" />}
        </button>
      ))}
    </div>
  )
}
