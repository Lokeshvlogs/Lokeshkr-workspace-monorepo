'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import PhotoLightbox from '@/components/profile/PhotoLightbox'

/**
 * The gallery, as a two-up grid you scroll down rather than a block you scan.
 *
 * It shares its row with the family graph, so it is sized to exactly two
 * thumbnails across and capped at two rows tall; everything past the fourth
 * photo is reached by scrolling. Alone in that row - a profile with no family
 * on record - the panel stretches and the grid simply lays out more columns,
 * which is handled entirely in CSS by `.photo-rail-track`'s auto-fill.
 *
 * A native scroll container, not a transform track: the number of photos is
 * small and variable, and scrolling natively keeps touch momentum, trackpad
 * gestures and keyboard scrolling without any height arithmetic. The wizard's
 * `HorizontalFormSlider` uses a transform because it needs an authoritative
 * "current step"; a photo grid has no such notion.
 *
 * It deliberately does not reuse `.photo-grid` / `.photo-tile` - those belong to
 * `PhotoGallery`, the wizard's editor, and this is the read-only viewer.
 */
export default function PhotoStrip({ photos, name }: { photos: string[]; name: string }) {
  const [openAt, setOpenAt] = useState<number | null>(null)
  const track = useRef<HTMLDivElement | null>(null)
  const [canScroll, setCanScroll] = useState({ up: false, down: false })

  const measure = useCallback(() => {
    const node = track.current
    if (!node) return
    // A pixel of tolerance: fractional scroll positions would otherwise leave
    // an arrow enabled at the very end of the track with nothing to scroll to.
    const maxTop = node.scrollHeight - node.clientHeight
    setCanScroll({ up: node.scrollTop > 1, down: node.scrollTop < maxTop - 1 })
  }, [])

  useEffect(() => {
    const node = track.current
    if (!node) return
    measure()
    node.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      node.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [measure, photos.length])

  if (!photos || photos.length === 0) return null

  const nudge = (direction: -1 | 1) => {
    const node = track.current
    if (!node) return
    // Half the viewport is one row: the track is capped at two rows tall, so a
    // click advances the grid by exactly one rank of thumbnails.
    node.scrollBy({ top: direction * node.clientHeight * 0.5, behavior: 'smooth' })
  }

  return (
    <section className="form-section photo-panel">
      <div className="photo-rail-head">
        <h3 className="form-section-title">Photos</h3>
        {/* Always drawn, and dimmed by `disabled` when there is nowhere to
            scroll. They used to disappear whenever the grid already fitted.
            That read as "this panel has no navigation" rather than "you can
            already see everything", and it disagreed with the lightbox, which
            draws its arrows unconditionally and dims the one with nowhere to
            go. Two visible rows means five photos are already enough to
            overflow, so these are live far more often than the old sideways
            pair, which needed all six. */}
        <div className="photo-rail-nav">
          <button
            type="button"
            className="photo-rail-arrow"
            onClick={() => nudge(-1)}
            disabled={!canScroll.up}
            aria-label="Scroll photos up"
          >
            <ChevronUp size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="photo-rail-arrow"
            onClick={() => nudge(1)}
            disabled={!canScroll.down}
            aria-label="Scroll photos down"
          >
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="photo-rail-track" ref={track}>
        {photos.map((photo, index) => (
          <button
            key={`${index}-${photo.slice(-24)}`}
            type="button"
            className="photo-rail-tile"
            onClick={() => setOpenAt(index)}
            aria-label={`View photo ${index + 1} of ${name}`}
          >
            {/* Uploaded images of unknown dimensions. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={`${name} photo ${index + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {openAt !== null && (
        <PhotoLightbox
          photos={photos}
          index={openAt}
          onIndexChange={setOpenAt}
          onClose={() => setOpenAt(null)}
          name={name}
        />
      )}
    </section>
  )
}
