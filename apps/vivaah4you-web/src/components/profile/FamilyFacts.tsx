'use client'

import React from 'react'

import EditableField from '@/components/profile/EditableField'
import { familyFacts } from '@/lib/familyFacts'
import type { PublicProfile, SaveField } from '@/types/profile'

/**
 * Where and how a family lives, as a band of pills under its tree.
 *
 * A `<dl>` of tiles rather than a `<ul>` of pills, because the owner's editor
 * renders a `<dd>` and a `<dd>` outside a `<dl>` is invalid markup. The pills
 * are shaped like the hero tags on purpose - a fact under the tree and a fact
 * under the display picture are the same kind of object, and should read that
 * way.
 */
export default function FamilyFacts({
  profile,
  onSave,
}: {
  profile: PublicProfile
  onSave?: SaveField
}) {
  const facts = familyFacts(profile, { owner: Boolean(onSave) })
  if (facts.length === 0) return null

  return (
    <dl className="family-facts">
      {facts.map((fact) => {
        const Icon = fact.icon

        return (
          <div
            key={fact.id}
            className={`family-fact ${fact.feeder ? 'family-fact-feeder' : ''}`}
            title={fact.title}
          >
            {Icon && <Icon className="family-fact-icon" strokeWidth={1.8} />}
            <dt className="sr-only">{fact.srLabel}</dt>

            {onSave ? (
              <EditableField def={fact.def} profile={profile} onSave={onSave} bare />
            ) : (
              <dd className="family-fact-value">{fact.label}</dd>
            )}
          </div>
        )
      })}
    </dl>
  )
}
