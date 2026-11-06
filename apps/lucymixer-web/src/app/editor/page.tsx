import type { Metadata } from 'next'
import EditorClient from './EditorClient'

export const metadata: Metadata = {
  title: 'Editor · LucyMixer'
}

export default function EditorPage() {
  return <EditorClient />
}
