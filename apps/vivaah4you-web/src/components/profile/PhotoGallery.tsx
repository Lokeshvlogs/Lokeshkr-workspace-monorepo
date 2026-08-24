'use client'

import React, { useRef, useState } from 'react'

interface Props {
  value: string[]
  onChange: (photos: string[]) => void
  max?: number
  maxSizeMB?: number
}

/** Longest edge of a stored gallery image. Keeps the save payload sane. */
const MAX_EDGE = 1200
const JPEG_QUALITY = 0.82

/**
 * Downscale before storing. Gallery photos travel to the API as base64 inside
 * the step payload, so a handful of untouched 4MB camera shots would otherwise
 * make the request enormous.
 */
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read-failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode-failed'))
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
        const width = Math.round(img.naturalWidth * scale)
        const height = Math.round(img.naturalHeight * scale)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function PhotoGallery({ value, onChange, max = 6, maxSizeMB = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const remaining = max - value.length

  const addFiles = async (files: FileList | null) => {
    setError(null)
    if (!files || files.length === 0) return

    const chosen = Array.from(files).slice(0, Math.max(0, remaining))
    if (chosen.length === 0) {
      setError(`You can add up to ${max} extra photos.`)
      return
    }

    setBusy(true)
    try {
      const added: string[] = []
      for (const file of chosen) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`Each photo must be under ${maxSizeMB}MB.`)
          continue
        }
        try {
          added.push(await downscale(file))
        } catch {
          setError('One of those images could not be read.')
        }
      }
      if (added.length) onChange([...value, ...added])
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="w-full">
      <div className="photo-grid">
        {value.map((photo, index) => (
          <div key={`${index}-${photo.slice(-24)}`} className="photo-tile">
            {/* Data URLs and uploaded files of unknown dimensions. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={`Photo ${index + 1}`} />
            <button
              type="button"
              className="photo-tile-remove"
              onClick={() => removeAt(index)}
              aria-label={`Remove photo ${index + 1}`}
            >
              ✕
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            className="photo-add"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            {busy ? 'Adding…' : 'Add'}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      <p className="mt-2 text-xs text-color-placeholder-text">
        {value.length} of {max} added — optional, but profiles with a few photos get more interest.
      </p>
      {error && <p className="error-text mt-1">{error}</p>}
    </div>
  )
}
