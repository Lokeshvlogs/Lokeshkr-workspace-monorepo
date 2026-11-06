'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban } from 'lucide-react'

import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useBlock } from '@/hooks/useBlock'

interface Props {
  profileId: string
  /** Used in the confirmation copy, so it names a person and not an id. */
  name: string
}

/**
 * Blocking, from the profile page.
 *
 * Deliberately not on the search card: in a grid of 48 it would sit one
 * mis-tap from Save, and this is the one action here that cannot be shrugged
 * off. It is undone from Settings, which is far enough away to be a decision.
 */
export default function BlockButton({ profileId, name }: Props) {
  const router = useRouter()
  const { block, busy, error } = useBlock()
  const [asking, setAsking] = useState(false)

  const confirm = async () => {
    if (await block(profileId)) {
      // They have left this member's pool, so the profile behind this dialog
      // no longer exists for them - staying on it would 404 on reload.
      router.push('/matches')
    }
  }

  return (
    <>
      <button type="button" className="profile-block-btn" onClick={() => setAsking(true)}>
        <Ban className="profile-block-icon" strokeWidth={2} aria-hidden="true" />
        Block
      </button>

      <ConfirmDialog
        open={asking}
        title={`Block ${name}?`}
        body={
          <>
            <p>
              You will not see {name} in your matches again, and they will not see you.
              Any interest between you is declined and any chat you share is closed.
            </p>
            <p className="confirm-note">
              They are not told. You can undo this from Settings → Blocked members.
            </p>
          </>
        }
        confirmLabel="Block"
        destructive
        busy={busy}
        error={error}
        onConfirm={confirm}
        onClose={() => setAsking(false)}
      />
    </>
  )
}
