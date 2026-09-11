import React from 'react'
import {
  BookMarked,
  BookOpen,
  Film,
  Library,
  Link2,
  Music2,
  Youtube,
} from 'lucide-react'

import { PROVIDERS, type Provider } from '@/config/linkPreview'

/**
 * The mark shown on a pick that has no artwork.
 *
 * Which is most of them, more often than it looks: IMDb and Goodreads block
 * server-side reads frequently, and plenty of members will type a title and
 * never paste anything. A tinted glyph is what keeps those cards looking
 * deliberate rather than broken.
 *
 * Lucide marks rather than brand logos - the real ones are trademarked, and a
 * matrimonial profile is not the place to imply an endorsement.
 */
const GLYPHS: Record<string, React.ComponentType<{ size?: number }>> = {
  youtube: Youtube,
  spotify: Music2,
  imdb: Film,
  goodreads: BookOpen,
  googlebooks: BookOpen,
  openlibrary: Library,
  wattpad: BookMarked,
}

export function ProviderGlyph({ provider, size = 20 }: { provider: string; size?: number }) {
  const Glyph = GLYPHS[provider] ?? Link2
  return <Glyph size={size} />
}

/** "YouTube", "Open Library" - the name to print on a card's provider chip. */
export function providerLabel(provider: string): string {
  return PROVIDERS[provider as Provider]?.label ?? ''
}
