'use client'

import React, { useState } from 'react'

/** Read-only gallery shown on the profile pages. */
export default function PhotoStrip({ photos, name }: { photos: string[]; name: string }) {
  const [active, setActive] = useState<string | null>(null)

  if (!photos || photos.length === 0) return null

  return (
    <section className="form-section">
      <h3 className="form-section-title">Photos</h3>
      <div className="photo-grid mt-3">
        {photos.map((photo, index) => (
          <button
            key={`${index}-${photo.slice(-24)}`}
            type="button"
            className="photo-tile"
            onClick={() => setActive(photo)}
            aria-label={`View photo ${index + 1} of ${name}`}
          >
            {/* Uploaded images of unknown dimensions. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={`${name} photo ${index + 1}`} />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active}
            alt={`${name} enlarged`}
            className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium"
          >
            Close
          </button>
        </div>
      )}
    </section>
  )
}
