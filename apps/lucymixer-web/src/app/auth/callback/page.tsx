'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Google sends the browser back here with a code; the Supabase client exchanges it for a session
// as it starts (PKCE), then we return to where sign-in began.
function Callback() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const raw = params.get('next') || '/editor'
    const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/editor'
    const failed = params.get('error_description') || params.get('error')
    if (failed) {
      setError(failed)
      return
    }
    supabase()
      .auth.getSession()
      .then(({ data, error: err }) => {
        if (err || !data.session) setError(err?.message || 'Sign-in did not complete')
        else router.replace(next)
      })
  }, [params, router])

  return (
    <main className="lm-page lm-center">
      {error ? (
        <p>
          Couldn&apos;t sign in: {error}. <a href="/">Back to LucyMixer</a>
        </p>
      ) : (
        <p>Signing you in…</p>
      )}
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <Callback />
    </Suspense>
  )
}
