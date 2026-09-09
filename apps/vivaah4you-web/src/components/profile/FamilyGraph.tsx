'use client'

import React, { useEffect, useState } from 'react'

import Avatar from '@/components/profile/Avatar'
import { toRows, type FamilyMember } from '@/lib/family'

interface Props {
  /** Omit for your own family; pass a profile id to read somebody else's. */
  profileId?: string
  /** Names the middle row - "Priya's generation", or "You and your siblings". */
  selfLabel?: string
  /** Shown at the centre of the member's own row. */
  selfName?: string
  selfPhoto?: string | null
  /** Owner-only: reveals the edit affordances. */
  onEdit?: () => void
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
  profileId,
  selfLabel = 'Their generation',
  selfName = 'Them',
  selfPhoto,
  onEdit,
}: Props) {
  const [members, setMembers] = useState<FamilyMember[]>([])
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
        if (!cancelled) setMembers(Array.isArray(data?.results) ? data.results : [])
      })
      .catch(() => {
        if (!cancelled) setMembers([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [profileId])

  if (loading) {
    return (
      <section className="form-section">
        <p className="form-section-title">Family</p>
        <div className="panel-skeleton-rows mt-3" aria-hidden="true">
          <span />
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
    <section className="form-section family">
      <div className="family-head">
        <p className="form-section-title">Family</p>
        {onEdit && (
          <button type="button" className="profile-bio-edit" onClick={onEdit}>
            {members.length === 0 ? 'Add your family' : 'Edit'}
          </button>
        )}
      </div>

      {members.length === 0 ? (
        <p className="form-section-hint">
          Add the people you live with. Families read each other&rsquo;s profiles as closely as
          they read yours.
        </p>
      ) : (
        <div className="family-tree">
          {rows.map((row, rowIndex) => (
            <div key={row.generation} className="family-row">
              <p className="family-row-label">{row.label}</p>

              {/* The tie to the generation above. Drawn rather than bordered so
                  it reads as a tree and not as a table rule. */}
              {rowIndex > 0 && <span className="family-link" aria-hidden="true" />}

              <div className="family-nodes">
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
                      <span className="family-relation">{member.relationLabel}</span>

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
