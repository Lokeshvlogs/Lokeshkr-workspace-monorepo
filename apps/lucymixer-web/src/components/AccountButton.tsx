'use client'

import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, signInWithGoogle, signOut } from '@/lib/supabase'

// A button with a native click listener: inside the editor's top bar, clicks don't bubble up to
// React's root listener (the editor stops them at its own root).
function NativeButton({ className, onPress, disabled, children }: { className: string; onPress: () => void; disabled?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null)
  const press = useRef(onPress)
  press.current = onPress
  useEffect(() => {
    const b = ref.current
    if (!b) return
    const click = () => press.current()
    b.addEventListener('click', click)
    return () => b.removeEventListener('click', click)
  }, [])
  return (
    <button ref={ref} type="button" className={className} disabled={disabled}>
      {children}
    </button>
  )
}

// Google sign-in (free): it shows the user's saved favorites and history in the editor.
export default function AccountButton({ compact = false, next }: { compact?: boolean; next?: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const auth = supabase().auth
    auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })
    const { data } = auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!ready) return null
  const cls = compact ? 'lm-account lm-account-compact' : 'lm-account'

  if (!user) {
    return (
      <NativeButton
        className={`${cls} lm-btn lm-btn-primary`}
        disabled={busy}
        onPress={() => {
          setBusy(true)
          signInWithGoogle(next ?? window.location.pathname).catch(() => setBusy(false))
        }}
      >
        Sign in with Google
      </NativeButton>
    )
  }
  const name = (user.user_metadata?.full_name as string) || user.email || 'Signed in'
  return (
    <span className={cls}>
      <span className="lm-avatar" title={user.email ?? ''}>
        {name.slice(0, 1).toUpperCase()}
      </span>
      {!compact && <span className="lm-account-name">{name}</span>}
      <NativeButton className="lm-btn lm-btn-quiet" onPress={() => void signOut()}>
        Sign out
      </NativeButton>
    </span>
  )
}
