"use client"

import { Suspense } from 'react'
import Link from 'next/link'

import MatchesSection from '@/components/profile/MatchesSection'
import MemberHome from '@/components/home/MemberHome'
import { useAuth } from '@/components/authProvider'
import RegisterForm from './Register/RegisterForm'
import { HERO_FALLBACK_CLASS, HERO_IMAGES } from '@/constants/homeImagery'

const TRUST_STATS = [
  { value: 'Verified', label: 'Contact and identity checks' },
  { value: 'Private', label: 'You choose who sees your photos' },
  { value: 'Free', label: 'To create a profile and browse' },
]

const FEATURES = [
  {
    title: 'Verified profiles',
    body: 'Every member confirms a mobile number, and contact details are checked before a profile goes live.',
    icon: (
      <>
        <path d="M12 3 4 6.5v5c0 4.6 3.2 8.6 8 9.5 4.8-.9 8-4.9 8-9.5v-5L12 3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    title: 'Privacy you control',
    body: 'Hide your photos from search, or your whole profile, at any time. Contact details are shared only when both sides agree.',
    icon: (
      <>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 1 1 8 0v3" />
      </>
    ),
  },
  {
    title: 'Matches that fit',
    body: 'Filter by age, religion, community and location, and see how well each profile lines up with what you are looking for.',
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
  },
]

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="feature-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/**
 * Staggered photo collage. The two outer panels are taller, so the grid reads
 * as a considered composition rather than four equal tiles.
 */
function HeroCollage() {
  return (
    <div className="collage" aria-label="Members of Vivah4U" role="img">
      {HERO_IMAGES.map((image, index) => (
        <figure
          key={image.src}
          className={`collage-item ${image.tall ? 'collage-item-tall' : ''}`}
          style={{ animationDelay: `${index * 90}ms` }}
        >
          {/* Remote imagery of unknown dimensions - see constants/homeImagery.ts */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            loading={index < 2 ? 'eager' : 'lazy'}
            onError={(e) => {
              // A dead or blocked link becomes a soft brand panel rather than a
              // broken-image icon in the middle of the hero.
              const el = e.currentTarget
              el.classList.add(HERO_FALLBACK_CLASS)
              el.removeAttribute('src')
            }}
          />
        </figure>
      ))}
    </div>
  )
}

function GuestHome() {
  return (
    <div className="hero-bg">
      <div className="container mx-auto px-6 pb-20 pt-12 lg:pt-16">
        <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <span className="hero-eyebrow">Trusted Indian matrimony</span>

            <h1 className="hero-title">
              Where traditions
              <span className="hero-title-accent"> meet their match</span>
            </h1>

            <p className="hero-lede">
              Curated, verified profiles and family-friendly matchmaking — with the privacy
              and polish of a modern app. Thoughtfully built for meaningful connections.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#profiles" className="btn-primary">
                Browse profiles
              </Link>
              <Link href="#features" className="btn border border-color-border bg-white">
                How it works
              </Link>
            </div>

            <dl className="hero-stats">
              {TRUST_STATS.map((stat) => (
                <div key={stat.value} className="hero-stat">
                  <dt className="hero-stat-value">{stat.value}</dt>
                  <dd className="hero-stat-label">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroCollage />
        </section>

        {/* Sign-up sits below the fold on its own, rather than crowding the hero. */}
        <section id="register" className="mt-20 scroll-mt-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div className="max-w-md">
              <h2 className="section-title">Create your profile</h2>
              <p className="section-lede">
                It takes a couple of minutes. You will confirm your mobile number with a
                short code, then build your profile at your own pace — every step saves as
                you go.
              </p>
              <ul className="checklist">
                <li>Free to join and to browse</li>
                <li>Your photos stay private until you choose otherwise</li>
                <li>Register for yourself or on behalf of family</li>
              </ul>
            </div>
            <RegisterForm />
          </div>
        </section>

        {/* Renders the search bar and results for members, and the reason it is
            members-only for everyone else. */}
        <MatchesSection />

        <section id="features" className="mt-20 scroll-mt-24">
          <h2 className="section-title">Why Vivah4U</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="feature-card">
                <span className="feature-icon-wrap">
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                </span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-body">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="site-footer">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span>© {new Date().getFullYear()} Vivah4U</span>
            <Link href="#features" className="hover:underline">How it works</Link>
            <Link href="/login" className="hover:underline">Sign in</Link>
            <a href="mailto:hello@vivah4u.com" className="hover:underline">Contact us</a>
          </div>
          <p className="mt-3 text-xs">Built with care for families looking for the right match.</p>
        </footer>
      </div>
    </div>
  )
}

/**
 * Two different products share this route.
 *
 * A visitor gets the marketing page - hero, collage, sign-up. A member gets a
 * search-first dashboard with none of that. Sign-in state is rehydrated from
 * localStorage, so `isReady` gates the choice: without it the marketing hero
 * would paint for a frame before being replaced, which is a jarring flash
 * between two entirely different layouts.
 */
export default function Home() {
  const auth = useAuth()

  if (!auth.isReady) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="home-boot" aria-hidden="true" />
      </div>
    )
  }

  // MemberHome reads the centre-column view out of the query string, and
  // useSearchParams needs a Suspense boundary above it to prerender.
  return auth.isAuthenticated ? (
    <Suspense fallback={<div className="container mx-auto px-6 py-12"><div className="home-boot" aria-hidden="true" /></div>}>
      <MemberHome />
    </Suspense>
  ) : (
    <GuestHome />
  )
}
