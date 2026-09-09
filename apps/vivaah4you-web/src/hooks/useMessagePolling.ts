'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * How often to ask, by what the member is actually doing.
 *
 * There is no realtime transport in this stack - Django is WSGI with
 * django-ninja and no channels layer, and SSE over WSGI holds a worker thread
 * per connected client, so ten open tabs is an outage rather than a feature.
 * Polling it is, but paced: a thread you are reading is worth 3s, a badge on
 * some other page is worth a minute, and a hidden tab is worth nothing at all.
 */
export const POLL_INTERVAL = {
  /** Reading a thread, tab focused. Asks only for messages after the last id. */
  thread: 3_000,
  /** Thread open, tab in the background. */
  threadBlurred: 20_000,
  /** Looking at the inbox list. */
  inbox: 15_000,
  /** Navbar badge only. */
  badge: 60_000,
} as const

export type PollMode = keyof typeof POLL_INTERVAL

const MAX_BACKOFF = 60_000

interface Options {
  mode: PollMode
  enabled?: boolean
  /** Return false to signal a failure and trigger backoff. */
  onTick: () => Promise<boolean | void>
}

export function useMessagePolling({ mode, enabled = true, onTick }: Options) {
  const [hidden, setHidden] = useState(false)
  const failures = useRef(0)
  // Held in a ref so a caller passing an inline function does not restart the
  // timer on every render.
  const tick = useRef(onTick)
  tick.current = onTick

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    // A hidden tab is paused outright rather than slowed. Nobody is reading it,
    // and every tick still costs two requests - browser to Next, Next to Django.
    if (!enabled || hidden) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const run = async () => {
      let ok: boolean | void = true
      try {
        ok = await tick.current()
      } catch {
        ok = false
      }
      if (cancelled) return

      failures.current = ok === false ? failures.current + 1 : 0

      const base = POLL_INTERVAL[mode]
      // Doubling on failure, capped: a server having a bad minute should not be
      // asked sixty times about it.
      const delay = failures.current
        ? Math.min(base * 2 ** failures.current, MAX_BACKOFF)
        : base

      timer = setTimeout(run, delay)
    }

    timer = setTimeout(run, POLL_INTERVAL[mode])

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [mode, enabled, hidden])

  return { paused: hidden || !enabled }
}
