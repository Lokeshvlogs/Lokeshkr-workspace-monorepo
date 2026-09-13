'use client'

import React from 'react'

import { educationTimeline } from '@/lib/educationTimeline'
import type { PublicProfile } from '@/types/profile'

/**
 * Qualifications down a line, highest first.
 *
 * Newest-first rather than oldest-first: a reader wants the qualification
 * someone holds, not the order they collected them, and the derived
 * `educationLevel` the rest of the app shows is the top one.
 */
export default function EducationTimeline({ profile }: { profile: PublicProfile }) {
  const nodes = educationTimeline(profile)
  if (nodes.length === 0) return null

  return (
    <ol className="edu-timeline">
      {nodes.map((node, index) => (
        <li
          key={node.key}
          className="edu-node"
          // Staggered so the list arrives as a sweep rather than all at once -
          // the same entrance the trending rail uses.
          style={{ animationDelay: `${index * 60}ms` }}
        >
          {/* No year, no slot. A dash where a date should be reads as missing
              data rather than as data nobody asked for. */}
          {node.year !== null && <p className="edu-node-year">{node.year}</p>}

          <p className="edu-node-level">{node.level || 'Education'}</p>

          {(node.fieldOfStudy || node.institution || node.country) && (
            <p className="edu-node-meta">
              {[node.fieldOfStudy, node.institution, node.country].filter(Boolean).join(' · ')}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
