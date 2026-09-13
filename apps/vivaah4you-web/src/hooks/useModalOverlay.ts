'use client'

import { useEffect, useRef } from 'react'

/**
 * The three things a modal overlay owes a keyboard and a scrollbar.
 *
 * Escape to leave, focus that goes in and comes back, and a page behind that
 * does not scroll underneath. None of the three existed in this app before -
 * Escape is hand-rolled in five separate components and nothing has ever locked
 * body scroll - so this is deliberately small and general enough that those can
 * adopt it later.
 *
 * It is NOT the same thing as `packages/ui`'s `useOverlay`, which positions a
 * dropdown against a trigger and closes on scroll. This one is for a surface
 * that covers the page: `aria-modal="true"`, focus trapped inside, scroll held
 * still. A dropdown wants none of that.
 */

/** Anything a user can Tab to, in DOM order. */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * How many overlays are currently holding the scrollbar.
 *
 * Module-level because the lock is a property of the document, not of any one
 * overlay: with two open, the first to close must not hand scrolling back while
 * the second is still up.
 */
let lockCount = 0
let restoreOverflow = ''
let restorePaddingRight = ''

function lockScroll() {
  if (lockCount === 0) {
    const { body, documentElement } = document
    restoreOverflow = body.style.overflow
    restorePaddingRight = body.style.paddingRight

    // Removing the scrollbar shifts the whole page sideways under the overlay.
    // Replacing its width with padding keeps everything where it was.
    const gap = window.innerWidth - documentElement.clientWidth
    if (gap > 0) body.style.paddingRight = `${gap}px`
    body.style.overflow = 'hidden'
  }
  lockCount += 1
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = restoreOverflow
    document.body.style.paddingRight = restorePaddingRight
  }
}

interface Options {
  open: boolean
  onClose: () => void
  /** The dialog element. Focus moves here on open and is trapped inside it. */
  ref: React.RefObject<HTMLElement | null>
}

export function useModalOverlay({ open, onClose, ref }: Options) {
  // Captured rather than passed in: whatever had focus when the overlay opened
  // is where focus belongs when it closes, and the caller should not have to
  // remember which element that was.
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    returnTo.current = document.activeElement as HTMLElement | null
    lockScroll()
    ref.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !ref.current) return

      // A real trap, unlike the messenger drawer's deliberate non-modal focus
      // handling: this surface claims aria-modal, so Tab must not walk out of
      // it and into the page it is covering.
      const focusable = Array.from(
        ref.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((node) => node.offsetParent !== null || node === document.activeElement)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlockScroll()
      returnTo.current?.focus?.()
    }
  }, [open, onClose, ref])
}

export default useModalOverlay
