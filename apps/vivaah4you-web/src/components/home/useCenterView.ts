'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export type CenterView =
  | { kind: 'matches' }
  | { kind: 'me' }
  | { kind: 'interests' }
  | { kind: 'chats' }
  | { kind: 'match'; profileId: string }

/**
 * Which view the dashboard's centre column is showing.
 *
 * The URL is the single source of truth, read through `useSearchParams`. An
 * earlier version kept the view in React state and pushed to the URL with
 * `history.pushState`, which left two sources of truth that could disagree:
 * anything navigating with the Next router - the navbar's own Matches link -
 * changed the URL without the component ever noticing, so the centre column
 * stayed on whatever it was already showing. Reading the router's value means
 * every route into the dashboard lands on the right view, whoever caused it,
 * and Back/Forward come from the router rather than a hand-rolled listener.
 */
export function useCenterView() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  /** Where the matches grid was scrolled to before opening a profile. */
  const restoreTo = useRef(0)

  let view: CenterView = { kind: 'matches' }
  const requested = params.get('view')
  if (requested === 'me') {
    view = { kind: 'me' }
  } else if (requested === 'interests') {
    view = { kind: 'interests' }
  } else if (requested === 'chats') {
    view = { kind: 'chats' }
  } else if (requested === 'match') {
    const id = params.get('id')
    if (id) view = { kind: 'match', profileId: id }
  }

  const kind = view.kind

  // Opening a profile from halfway down the grid should not drop you halfway
  // down the profile; coming back should not lose your place in the grid.
  // 'auto', not 'smooth': the stylesheet honours prefers-reduced-motion
  // everywhere else and a scripted smooth scroll would ignore it.
  useEffect(() => {
    window.scrollTo({ top: kind === 'matches' ? restoreTo.current : 0, behavior: 'auto' })
  }, [kind, params])

  const go = useCallback(
    (next: CenterView) => {
      if (kind === 'matches' && next.kind !== 'matches') {
        restoreTo.current = window.scrollY
      }

      const url =
        next.kind === 'me'
          ? `${pathname}?view=me`
          : next.kind === 'interests'
            ? `${pathname}?view=interests`
            : next.kind === 'chats'
            ? `${pathname}?view=chats`
            : next.kind === 'match'
              ? `${pathname}?view=match&id=${encodeURIComponent(next.profileId)}`
              : pathname

      // The effect above owns scrolling, so the router must not also do it.
      router.push(url, { scroll: false })
    },
    [kind, pathname, router],
  )

  const showMatches = useCallback(() => go({ kind: 'matches' }), [go])
  const showMe = useCallback(() => go({ kind: 'me' }), [go])
  const showInterests = useCallback(() => go({ kind: 'interests' }), [go])
  const showChats = useCallback(() => go({ kind: 'chats' }), [go])
  const showMatch = useCallback((profileId: string) => go({ kind: 'match', profileId }), [go])

  return { view, showMatches, showMe, showInterests, showChats, showMatch }
}
