'use client'

import React, { useEffect, useState } from 'react'

import Avatar from '@/components/profile/Avatar'
import { deriveMembers, mergeMembers, toRows, type FamilyMember } from '@/lib/family'
import { labelFor } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

interface Props {
  /**
   * The profile whose family this is. Its sibling counts and parent
   * occupations imply the nodes that nobody has named yet.
   */
  profile?: PublicProfile | null
  /** Omit for your own family; pass a profile id to read somebody else's. */
  profileId?: string
  /** Names the middle row - "Priya's generation", or "You and your siblings". */
  selfLabel?: string
  /** Shown at the centre of the member's own row. */
  selfName?: string
  selfPhoto?: string | null
  /** Owner-only: reveals the edit affordances. */
  onEdit?: () => void
  /** Smaller nodes and no card of its own, for showing two families together. */
  compact?: boolean
  /** Replaces the "Family" heading. */
  heading?: string
}

/**
 * A family, as a tree you can look through rather than four numbers.
 *
 * A profile already said "2 brothers, 1 sister, father an engineer" - enough to
 * score completeness and nowhere near enough to picture a household, which is
 * what both sides are really weighing up. Each node opens to show what is known
 * about that person.
 *
 * Laid out by generation, oldest at the top. The generation comes from the
 * server so the picture and the model cannot disagree about who is older.
 */
export default function FamilyGraph({
  profile,
  profileId,
  selfLabel = 'Their generation',
  selfName = 'Them',
  selfPhoto,
  onEdit,
  compact = false,
  heading = 'Family',
}: Props) {
  const [named, setNamed] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const url = profileId
      ? `/api/family/${encodeURIComponent(profileId)}`
      : '/api/family/me'

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setNamed(Array.isArray(data?.results) ? data.results : [])
      })
      .catch(() => {
        if (!cancelled) setNamed([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [profileId])

  /* The wizard's counts fill every slot nobody has named. Without this the
     graph was empty on every profile, because nothing but the profile editor
     has ever created a row. */
  const members = mergeMembers(deriveMembers(profile ?? null, labelFor), named)

  const shell = compact ? 'family family-compact' : 'form-section family'

  if (loading) {
    return (
      <section className={shell}>
        <p className="form-section-title">{heading}</p>
        <div className="panel-skeleton-rows mt-3" aria-hidden="true">
          <span />
        </div>
      </section>
    )
  }

  // A visitor looking at an empty family gets nothing; the owner gets the
  // prompt, because for them the blank is the thing to act on.
  if (members.length === 0 && !onEdit) return null

  const rows = toRows(members, selfLabel)

  return (
    <section className={shell}>
      <div className="family-head">
        <p className="form-section-title">{heading}</p>
        {onEdit && (
          <button type="button" className="profile-bio-edit" onClick={onEdit}>
            {members.length === 0 ? 'Add your family' : 'Edit'}
          </button>
        )}
      </div>

      {members.length === 0 ? (
        <p className="form-section-hint">
          {onEdit
            ? 'Add the people you live with. Families read each other’s profiles as closely as they read yours.'
            : 'No family added yet.'}
        </p>
      ) : (
        <div className="family-tree">
          {rows.map((row, rowIndex) => (
            <div key={row.generation} className="family-row">
              <p className="family-row-label">{row.label}</p>

              {/* The stem down from the generation above. */}
              {rowIndex > 0 && <span className="family-link" aria-hidden="true" />}

              {/* `data-linked` turns on the bar across the row and the drop
                  into each node - the top row has no parent to hang from. */}
              <div className="family-nodes" data-linked={rowIndex > 0 ? 'true' : undefined}>
                {row.generation === 0 && (
                  <div className="family-node family-node-self">
                    <span className="family-portrait">
                      <Avatar
                        src={selfPhoto}
                        name={selfName}
                        className="family-photo"
                        decorative
                      />
                    </span>
                    <span className="family-name">{selfName}</span>
                    <span className="family-relation">
                      {profileId ? 'This member' : 'You'}
                    </span>
                  </div>
                )}

                {row.members.map((member, index) => {
                  const open = openId === member.id
                  const label = member.name || member.relationLabel

                  return (
                    <button
                      key={member.id}
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : member.id)}
                      className={`family-node ${open ? 'family-node-open' : ''}`}
                      style={{ animationDelay: `${Math.min(index, 6) * 55}ms` }}
                    >
                      <span className="family-portrait">
                        <Avatar
                          src={member.photo}
                          name={label}
                          className="family-photo"
                          decorative
                        />
                        {member.isMarried && (
                          <span className="family-ring" title="Married" aria-hidden="true" />
                        )}
                      </span>

                      <span className="family-name">{label}</span>
                      <span className="family-relation">
                        {member.derived && member.name === '' ? 'Not named yet' : member.relationLabel}
                      </span>

                      {open && (member.occupation || member.about) && (
                        <span className="family-detail">
                          {member.occupation && (
                            <span className="family-detail-line">{member.occupation}</span>
                          )}
                          {member.about && (
                            <span className="family-detail-line">{member.about}</span>
                          )}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
