'use client'

import { useEffect, useState } from 'react'

/** Google's brand mark. Inline so it needs no remote asset and no CSP change. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  )
}

interface GoogleAuthButtonProps {
  /** Only changes the wording; both modes hit the same Google flow. */
  mode?: 'signup' | 'signin'
}

/**
 * "Continue with Google".
 *
 * The client id lives on the service and is not set yet, so the button asks
 * whether it is configured and renders disabled with an explanation until it
 * is. That way the option is visible and clearly pending rather than either
 * missing entirely or failing when pressed. Once GOOGLE_OAUTH_CLIENT_ID is set,
 * this component enables itself with no further change here.
 */
export default function GoogleAuthButton({ mode = 'signup' }: GoogleAuthButtonProps) {
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/google-config')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setConfigured(Boolean(data.configured))
      })
      .catch(() => {
        if (!cancelled) setConfigured(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const label = mode === 'signup' ? 'Register with Google' : 'Continue with Google'
  // `null` means the check has not answered yet - treat it as not ready rather
  // than flashing an enabled button that would fail if pressed.
  const ready = configured === true

  return (
    <div>
      <button
        type="button"
        className="auth-provider-btn"
        disabled={!ready}
        aria-describedby={ready ? undefined : 'google-auth-note'}
        onClick={() => {
          if (!ready) return
          // Sign-up through Google still has to confirm a mobile number, so the
          // callback lands on /verify, which asks for one when it has none.
          window.location.href = '/api/auth/google/start'
        }}
      >
        <GoogleMark />
        {label}
      </button>

      {configured === false && (
        <p id="google-auth-note" className="auth-note">
          Google sign-in is not configured yet. Use the form above for now.
        </p>
      )}
    </div>
  )
}
