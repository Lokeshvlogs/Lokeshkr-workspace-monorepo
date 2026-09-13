'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { useModalOverlay } from '@/hooks/useModalOverlay'

/** Long enough not to flicker mid-decision, short enough to get out of the way. */
const IDLE_MS = 2500

interface Props {
  photos: string[]
  /** Which photo is the main view. The caller owns this. */
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  name: string
}

/**
 * One photo full size, with every other photo along the bottom.
 *
 * Keyed by **index**, not by URL. The previous viewer stored the active URL,
 * which is why it could not offer next and previous - a URL says nothing about
 * what comes after it - and why two identical photos would have confused it.
 *
 * Portaled to `document.body`, and that is load-bearing rather than tidiness: a
 * `position: fixed` element is trapped by any ancestor carrying a `transform`,
 * and the photo panel this is opened from now lifts on hover. Left inside the
 * panel, the overlay would collapse into it the moment the pointer moved.
 *
 * Note on "full resolution": gallery photos are downscaled to a 1200px longest
 * edge before upload (see PhotoGallery), so this shows the largest image that
 * exists, not an original.
 */
export default function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
  name,
}: Props) {
  const dialog = useRef<HTMLDivElement | null>(null)
  const strip = useRef<HTMLDivElement | null>(null)

  useModalOverlay({ open: true, onClose, ref: dialog })

  /**
   * The close button gets out of the way of the picture when the mouse rests.
   *
   * The governing rule: **only ever go idle in response to a mouse that has
   * actually moved.** That one rule covers the two ways this normally breaks -
   * a keyboard user and a touch user never fire `pointermove`, so they never
   * arm the timer and the button simply stays put. No device sniffing.
   */
  const [idle, setIdle] = useState(false)
  const idleTimer = useRef<number | null>(null)

  const clearIdleTimer = () => {
    if (idleTimer.current !== null) {
      window.clearTimeout(idleTimer.current)
      idleTimer.current = null
    }
  }

  /** Something that is not a mouse is driving: show, and do not arm anything. */
  const holdChrome = useCallback(() => {
    setIdle(false)
    clearIdleTimer()
  }, [])

  useEffect(() => {
    const wake = () => {
      setIdle(false)
      clearIdleTimer()
      idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS)
    }
    // `pointermove` filtered on pointerType, not `mousemove`: some mobile
    // browsers synthesise a mousemove on tap, which would hide the close button
    // on the one device with no way to bring it back.
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') wake()
    }
    document.addEventListener('pointermove', onMove)
    return () => {
      document.removeEventListener('pointermove', onMove)
      clearIdleTimer()
    }
  }, [])

  const go = useCallback(
    (next: number) => {
      // Clamped, not wrapping. On a gallery of four, looping from the last
      // photo back to the first reads as a glitch rather than a feature.
      onIndexChange(Math.max(0, Math.min(photos.length - 1, next)))
    },
    [onIndexChange, photos.length],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Before the branching, so Tab counts too: the moment a member reaches
      // for the keyboard the chrome returns and stops hiding itself.
      holdChrome()
      if (event.key === 'ArrowLeft') go(index - 1)
      else if (event.key === 'ArrowRight') go(index + 1)
      else if (event.key === 'Home') go(0)
      else if (event.key === 'End') go(photos.length - 1)
      else return
      event.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [go, index, photos.length, holdChrome])

  // Keep the active thumbnail in view, and warm the two photos most likely to
  // be asked for next so a click does not land on a blank frame.
  useEffect(() => {
    const active = strip.current?.querySelector<HTMLElement>('[aria-current="true"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })

    for (const neighbour of [photos[index - 1], photos[index + 1]]) {
      if (neighbour) {
        const img = new Image()
        img.src = neighbour
      }
    }
  }, [index, photos])

  if (typeof document === 'undefined' || photos.length === 0) return null

  const atStart = index <= 0
  const atEnd = index >= photos.length - 1

  return createPortal(
    <div
      className="photo-lightbox"
      data-idle={idle ? 'true' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={`Photos of ${name}`}
      tabIndex={-1}
      ref={dialog}
      onClick={onClose}
    >
      <p className="sr-only" aria-live="polite">
        Photo {index + 1} of {photos.length}
      </p>

      <button
        type="button"
        className="photo-lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={18} aria-hidden="true" />
      </button>

      {/* The backdrop closes; the picture and the filmstrip do not. */}
      <div className="photo-lightbox-stage" onClick={(event) => event.stopPropagation()}>
        {/* Always drawn, never conditionally rendered. The one with nowhere to
            go is `disabled`, which dims it to 35% and makes it inert - a state
            a reader can see and understand ("I am at the end"), unlike an arrow
            that is simply absent, which reads as "this viewer has no
            navigation". On a single-photo gallery both are dimmed, which is
            honest rather than useless: `disabled` also takes them out of the
            tab order, so a keyboard user is never handed a dead control. */}
        <button
          type="button"
          className="photo-lightbox-arrow photo-lightbox-prev"
          onClick={() => go(index - 1)}
          disabled={atStart}
          aria-label="Previous photo"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[index]}
          alt={`${name} photo ${index + 1}`}
          className="photo-lightbox-image"
        />

        <button
          type="button"
          className="photo-lightbox-arrow photo-lightbox-next"
          onClick={() => go(index + 1)}
          disabled={atEnd}
          aria-label="Next photo"
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      {photos.length > 1 && (
        <div
          className="photo-lightbox-strip"
          ref={strip}
          onClick={(event) => event.stopPropagation()}
        >
          {photos.map((photo, position) => (
            <button
              key={`${position}-${photo.slice(-24)}`}
              type="button"
              className="photo-lightbox-thumb"
              // aria-current, not role="tab": these select a picture, they do
              // not switch panels.
              aria-current={position === index ? 'true' : undefined}
              onClick={() => go(position)}
              aria-label={`Photo ${position + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
