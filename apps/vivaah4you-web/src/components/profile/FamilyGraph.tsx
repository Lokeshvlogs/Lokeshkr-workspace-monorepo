'use client'

import React, { useEffect, useState } from 'react'

import Avatar from '@/components/profile/Avatar'
import FamilyFacts from '@/components/profile/FamilyFacts'
import { hasFamilyFacts } from '@/lib/familyFacts'
import { deriveMembers, mergeMembers, toRows, type FamilyMember } from '@/lib/family'
import { labelFor } from '@/lib/profileDisplay'
import type { PublicProfile, SaveField } from '@/types/profile'
import { FAMILY_PANEL_ICON } from '@/lib/profileIcons'

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
  /**
   * Owner-only: makes the household facts inline-editable.
   *
   * Separate from `onEdit`, which swaps the whole graph for the family editor.
   * This one is for the pencils on the band under the tree.
   */
  onSave?: SaveField
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
  onSave,
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

  /* This panel absorbed the Family section, so it now carries where and how
     the family lives as well as who is in it. `hasFamilyFacts` deliberately
     ignores familyType and livesWithFamily: Django defaults them to 0
     ("Nuclear") and true, so they are answered on every profile and would
     conjure a card for a member who has said nothing. */
  const showFacts = !compact
  const factsWorthACard = showFacts && hasFamilyFacts(profile)

  // A visitor gets nothing only when there is neither a tree nor a fact. The
  // owner always gets the card, because for them the blank is what to act on.
  //
  // Measured on the dev data before this guard was widened: 11 of 22 profiles
  // render an empty tree, and 5 of those DO have a family location and income
  // recorded - so the old `members.length === 0` test hid real content on
  // nearly a quarter of profiles.
  if (loading) {
    if (members.length === 0 && !factsWorthACard && !onEdit) return null
    return (
      <section className={shell}>
        <p className="form-section-title">{heading}</p>
        <div className="panel-skeleton-rows mt-3" aria-hidden="true">
          <span />
        </div>
      </section>
    )
  }

  if (members.length === 0 && !factsWorthACard && !onEdit) return null

  const rows = toRows(members, selfLabel)

  return (
    <section className={shell}>
      <div className="family-head">
        <p className="form-section-title">
          {/* The glyph the removed Family section carried, inherited along
              with its fields. */}
          <FAMILY_PANEL_ICON className="form-section-icon" strokeWidth={1.8} aria-hidden="true" />
          {heading}
        </p>
        {onEdit && (
          <button type="button" className="profile-bio-edit" onClick={onEdit}>
            {members.length === 0 ? 'Add your family' : 'Edit'}
          </button>
        )}
      </div>

      {showFacts && <FamilyFacts profile={profile as PublicProfile} onSave={onSave} />}

      {members.length === 0 ? (
        <p className="form-section-hint">
          {onEdit
            ? 'Add the people you live with. Families read each other’s profiles as closely as they read yours.'
            : 'The people in this family have not been added yet.'}
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
