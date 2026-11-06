'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { drafts } from '@/lib/drafts'
import { sources } from '@/lib/sources'
import AccountButton from './AccountButton'

// The editor is the plain-JS editor in public/editor (classic scripts sharing the IgfvEditor global),
// loaded in order once per page load and opened over the whole window.

type EditorApi = {
  open: (opts: Record<string, unknown>) => Promise<void>
  close: (force?: boolean) => void
  isOpen: () => boolean
  isDirty: () => boolean
  keyUp?: (e: KeyboardEvent) => void
}

declare global {
  interface Window {
    IgfvEditor?: EditorApi
  }
}
declare const IGFV_FX_PRESETS: { name: string; fx: unknown }[]

// Bump with any change to public/editor, so browsers fetch the new files.
const EDITOR_VERSION = '1'
const SCRIPTS = [
  'keys.js',
  'filters.js',
  'gif.js',
  'gifdec.js',
  'notoemoji.js',
  'model.js',
  'effects.js',
  'stickers.js',
  'render.js',
  'layers.js',
  'templates.js',
  'engine.js',
  'timeline.js',
  'core.js'
]

// The web editor's limit: up to 2560×1440. 4K and larger is for the desktop app.
const MAX_MEDIA = { long: 2560, short: 1440 }

let loading: Promise<void> | null = null

function addScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = false
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Couldn't load ${src}`))
    document.head.appendChild(s)
  })
}

function loadEditor() {
  loading ??= (async () => {
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = `/editor/editor.css?v=${EDITOR_VERSION}`
    document.head.appendChild(css)
    for (const file of SCRIPTS) await addScript(`/editor/${file}?v=${EDITOR_VERSION}`)
  })().catch((err) => {
    loading = null
    throw err
  })
  return loading
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export default function EditorHost() {
  const router = useRouter()
  const hostRef = useRef<HTMLDivElement>(null)
  const [bar, setBar] = useState<HTMLElement | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const topBar = document.createElement('div')
    topBar.className = 'lm-topbar'
    setBar(topBar)

    loadEditor()
      .then(async () => {
        const editor = window.IgfvEditor
        if (cancelled || !editor || !hostRef.current) return
        await editor.open({
          title: 'LucyMixer',
          name: 'Untitled',
          host: hostRef.current,
          topBar,
          startTab: 'files',
          maxMedia: MAX_MEDIA,
          desktopUrl: '/desktop',
          presets: IGFV_FX_PRESETS.map((p) => ({ name: p.name, fx: p.fx })),
          sources,
          drafts,
          save: async (blob: Blob, filename: string) => download(blob, filename),
          toast: (message: string) => setError(message),
          onClose: () => router.push('/')
        })
      })
      .catch((err: Error) => !cancelled && setError(err.message || "The editor didn't load"))

    // Keys are handled by the editor itself; key-ups end a held "compare".
    const onKeyUp = (e: KeyboardEvent) => window.IgfvEditor?.isOpen() && window.IgfvEditor.keyUp?.(e)
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (window.IgfvEditor?.isOpen() && window.IgfvEditor.isDirty()) e.preventDefault()
    }
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      cancelled = true
      window.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (window.IgfvEditor?.isOpen()) window.IgfvEditor.close(true)
    }
  }, [router])

  return (
    <>
      <div ref={hostRef} className="lm-editor-host" />
      {bar && createPortal(<AccountButton compact />, bar)}
      {error && (
        <div className="lm-editor-error" role="alert">
          {error} <a href="/">Back to LucyMixer</a>
        </div>
      )}
    </>
  )
}
