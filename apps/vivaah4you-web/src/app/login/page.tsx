'use client'

import { Suspense, useCallback, useEffect, useRef, useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { OtpInput, PasswordInput, SelectDropdown, TextField } from '@lokesh-workspace/ui'

import { useAuth } from '@/components/authProvider'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'
import { COUNTRY_CODES_OPTIONS } from '@/constants/selectOptions/places'

const CODE_LENGTH = 4

type Method = 'password' | 'otp'

function LoginCard() {
  const auth = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === '1'

  const [method, setMethod] = useState<Method>('password')
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  /* ---------- password ---------- */
  const [identifier, setIdentifier] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  /* ---------- passcode ---------- */
  const [countryCode, setCountryCode] = useState<string>('IN')
  const [phone, setPhone] = useState<string>('')
  const [codeSent, setCodeSent] = useState<boolean>(false)
  const [code, setCode] = useState<string>('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState<number>(0)
  const submitted = useRef<string>('')

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  function switchMethod(next: Method) {
    setMethod(next)
    setMessage('')
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const data = await response.json().catch(() => ({}))

      if (response.ok && data?.loggedIn) {
        // login() decides between the profile wizard and the home page.
        auth.login({
          username: data.username,
          isProfileComplete: data.isProfileComplete,
          profileId: data.profileId,
        })
        return
      }

      // An account that never confirmed its number is not a bad password -
      // send them to finish that rather than leaving them stuck here.
      if (data?.needsVerification) {
        router.push('/verify')
        return
      }

      setMessage(data?.detail || 'Login failed.')
      setLoading(false)
    } catch {
      setMessage('Could not reach the Vivah4U service. Please try again.')
      setLoading(false)
    }
  }

  async function sendCode() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 6) {
      setMessage('Enter the mobile number on your account.')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, country_code: countryCode, purpose: 'login' }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setMessage(data.detail ?? 'Could not send the code. Please try again.')
        return
      }

      setPhone(digits)
      setCodeSent(true)
      setDevCode(data.devCode ?? null)
      setCooldown(Number(data.retryAfter ?? 30))
    } catch {
      setMessage('Could not reach the Vivah4U service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = useCallback(
    async (submittedCode: string) => {
      if (submittedCode.length !== CODE_LENGTH) return
      submitted.current = submittedCode
      setLoading(true)
      setMessage('')

      try {
        const response = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            country_code: countryCode,
            code: submittedCode,
            purpose: 'login',
          }),
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok || !data.verified) {
          setMessage(data.detail ?? 'That code is incorrect or has expired.')
          setCode('')
          submitted.current = ''
          setLoading(false)
          return
        }

        auth.login({
          username: data.username,
          isProfileComplete: Boolean(data.isProfileComplete),
          profileId: data.profileId,
        })
      } catch {
        setMessage('Could not reach the Vivah4U service. Please try again.')
        submitted.current = ''
        setLoading(false)
      }
    },
    [auth, countryCode, phone],
  )

  return (
    <div className="auth-card">
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-subtitle">Sign in to see your matches and manage your profile.</p>

      {justRegistered && (
        <div className="auth-alert auth-alert-success">
          Your account is ready. Sign in to finish building your profile.
        </div>
      )}

      <div className="auth-tabs" role="tablist" aria-label="Sign-in method">
        <button
          type="button"
          role="tab"
          aria-selected={method === 'password'}
          className={`auth-tab ${method === 'password' ? 'auth-tab-active' : ''}`}
          onClick={() => switchMethod('password')}
        >
          Password
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={method === 'otp'}
          className={`auth-tab ${method === 'otp' ? 'auth-tab-active' : ''}`}
          onClick={() => switchMethod('otp')}
        >
          One-time code
        </button>
      </div>

      {method === 'password' ? (
        <form onSubmit={handlePasswordSubmit} className="mt-5 flex flex-col gap-4">
          <TextField
            id="identifier"
            name="identifier"
            label="Username or email"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {message && <div className="auth-alert auth-alert-error">{message}</div>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          {!codeSent ? (
            <>
              <div className="flex items-start gap-3">
                <div className="w-36 shrink-0">
                  <SelectDropdown
                    id="login-country-code"
                    label="Country code"
                    placeholder=""
                    options={COUNTRY_CODES_OPTIONS}
                    value={countryCode}
                    onChange={setCountryCode}
                    showButtonValue
                    searchable
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <TextField
                    id="login-phone"
                    label="Mobile number"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {message && <div className="auth-alert auth-alert-error">{message}</div>}

              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => void sendCode()}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send me a code'}
              </button>
            </>
          ) : (
            <>
              <OtpInput
                id="login-otp"
                label={`Code sent to ${countryCode} ••••${phone.slice(-4)}`}
                value={code}
                onChange={(next) => {
                  setCode(next)
                  if (message) setMessage('')
                }}
                onComplete={(next) => {
                  if (submitted.current !== next) void verifyCode(next)
                }}
                length={CODE_LENGTH}
                disabled={loading}
                errorValue={message || undefined}
                autoFocus
              />

              {devCode && !message && (
                <div className="auth-alert">
                  <strong>Development mode.</strong> No SMS provider is configured yet — use{' '}
                  <code className="font-semibold">{devCode}</code> to continue.
                </div>
              )}

              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => void verifyCode(code)}
                disabled={loading || code.length !== CODE_LENGTH}
              >
                {loading ? 'Verifying…' : 'Sign in'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="link disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                  onClick={() => void sendCode()}
                  disabled={loading || cooldown > 0}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  className="text-color-placeholder-text hover:underline"
                  onClick={() => {
                    setCodeSent(false)
                    setCode('')
                    setMessage('')
                  }}
                >
                  Use a different number
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="auth-divider">or</div>
      <GoogleAuthButton mode="signin" />

      <p className="auth-note">
        New here? <Link href="/#register" className="link">Create an account</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="hero-bg auth-shell">
      {/* useSearchParams needs a Suspense boundary to keep the route static. */}
      <Suspense fallback={<div className="auth-card">Loading…</div>}>
        <LoginCard />
      </Suspense>
    </div>
  )
}
