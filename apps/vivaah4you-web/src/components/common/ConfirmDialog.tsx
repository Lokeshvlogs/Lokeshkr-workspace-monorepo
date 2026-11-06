'use client'

import React, { useRef } from 'react'
import { createPortal } from 'react-dom'

import useModalOverlay from '@/hooks/useModalOverlay'

interface Props {
  open: boolean
  title: string
  /** The consequence, in the member's own terms. Not "are you sure?". */
  body: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Reddens the confirm button. For actions that take something away. */
  destructive?: boolean
  busy?: boolean
  error?: string
  onConfirm: () => void
  onClose: () => void
}

/**
 * The app's first confirm dialog.
 *
 * Built on `useModalOverlay`, which its own docstring says is meant to be
 * adopted this way - it brings Escape, a real focus trap, focus restore and a
 * refcounted scroll lock, none of which are worth writing twice.
 *
 * Portalled to the body like PhotoLightbox, and for the same load-bearing
 * reason: a `transform` on any ancestor turns `position: fixed` into
 * `position: absolute` relative to that ancestor, and the card and hero panels
 * this can open from both animate on transform.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  error = '',
  onConfirm,
  onClose,
}: Props) {
  const dialog = useRef<HTMLDivElement>(null)
  useModalOverlay({ open, onClose, ref: dialog })

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    // The backdrop closes; the panel does not.
    <div className="confirm-backdrop" onClick={onClose}>
      <div
        className="confirm-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        tabIndex={-1}
        ref={dialog}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="confirm-title" id="confirm-title">{title}</h2>
        <div className="confirm-body">{body}</div>

        {error && <p className="confirm-error">{error}</p>}

        <div className="confirm-actions">
          <button
            type="button"
            className="chip chip-square"
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-go ${destructive ? 'confirm-go-danger' : ''}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
