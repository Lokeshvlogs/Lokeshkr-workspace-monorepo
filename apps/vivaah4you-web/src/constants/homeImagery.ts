/**
 * Hero collage imagery.
 *
 * These are hotlinked from a third-party host. That is a licensing and
 * availability risk for a production site - the host can rate-limit, rewrite or
 * remove them at any time, and nothing here grants a right to display them.
 * Replace `src` with licensed assets served from this app before launch; the
 * layout and `alt` text do not need to change.
 *
 * `HERO_FALLBACK_CLASS` is applied when an image fails to load, so a dead link
 * degrades to a soft brand-coloured panel instead of a broken-image icon.
 */
export interface HeroImage {
  src: string
  alt: string
  /** Drives the staggered collage: taller panels sit in the outer column. */
  tall?: boolean
}

export const HERO_IMAGES: HeroImage[] = [
  {
    src: 'https://i.pinimg.com/1200x/42/26/91/422691e09e79e96b7075ef306a9c2d07.jpg',
    alt: 'A couple in traditional wedding dress under a decorated archway',
    tall: true,
  },
  {
    src: 'https://i.pinimg.com/1200x/5b/ff/eb/5bffeb824946fb9eee89e22cbbdab46b.jpg',
    alt: 'Hands joined during a wedding ritual',
  },
  {
    src: 'https://i.pinimg.com/1200x/69/82/29/69822936198d9451e50eab281ca524a1.jpg',
    alt: 'A bride wearing a floral garland',
  },
  {
    src: 'https://i.pinimg.com/736x/a5/4c/14/a54c14db0cdadc4fe97ec3e6d26a020b.jpg',
    alt: 'A couple smiling together in wedding attire',
    tall: true,
  },
]

export const HERO_FALLBACK_CLASS = 'collage-img-failed'
