'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import PhotoLightbox from '@/components/profile/PhotoLightbox'

/**
 * The gallery, as one row you scroll rather than a block you scan.
 *
 * A native scroll container, not a transform track: the number of photos is
 * small and variable, and scrolling natively keeps touch momentum, trackpad
 * gestures and keyboard scrolling without any width arithmetic. The wizard's
 * `HorizontalFormSlider` uses a transform because it needs an authoritative
 * "current step"; a photo row has no such notion.
 *
 * It deliberately does not reuse `.photo-grid` / `.photo-tile` - those belong to
 * `PhotoGallery`, the wizard's editor, and this is the read-only viewer.
 */
export default function PhotoStrip({ photos, name }: { photos: string[]; name: string }) {
  const [openAt, setOpenAt] = useState<number | null>(null)
  const track = useRef<HTMLDivElement | null>(null)
  const [canScroll, setCanScroll] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const node = track.current
    if (!node) return
    // A pixel of tolerance: fractional scroll positions would otherwise leave
    // an arrow enabled at the very end of the track with nothing to scroll to.
    const maxLeft = node.scrollWidth - node.clientWidth
    setCanScroll({ left: node.scrollLeft > 1, right: node.scrollLeft < maxLeft - 1 })
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
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: 'smooth' })
  }

  // Both arrows disappear when everything already fits, rather than sitting
  // there greyed out on a profile with two photos.
  const showArrows = canScroll.left || canScroll.right

  return (
    <section className="form-section">
      <div className="photo-rail-head">
        <h3 className="form-section-title">Photos</h3>
        {showArrows && (
          <div className="photo-rail-nav">
            <button
              type="button"
              className="photo-rail-arrow"
              onClick={() => nudge(-1)}
              disabled={!canScroll.left}
              aria-label="Scroll photos left"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="photo-rail-arrow"
              onClick={() => nudge(1)}
              disabled={!canScroll.right}
              aria-label="Scroll photos right"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
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
