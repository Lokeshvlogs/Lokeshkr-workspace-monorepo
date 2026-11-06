'use client'

import dynamic from 'next/dynamic'

// The editor runs only in the browser (canvas, WebGL, media, IndexedDB).
const EditorHost = dynamic(() => import('@/components/EditorHost'), {
  ssr: false,
  loading: () => <div className="lm-editor-loading">Loading the editor…</div>
})

export default function EditorClient() {
  return <EditorHost />
}
