'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { OtpInput, PasswordInput, SelectDropdown, TextField } from '@lokesh-workspace/ui'

import { useAuth } from '@/components/authProvider'
import { COUNTRY_CODES_OPTIONS } from '@/constants/selectOptions/places'

const CODE_LENGTH = 4

interface Account {
  username: string
  email: string
  phone: string
  countryCode: string
  phoneVerified: boolean
  hasUsablePassword: boolean
}

/** One collapsible block per credential, so only one form is open at a time. */
function SettingsSection({
  title,
  description,
  value,
  open,
  onToggle,
  children,
}: {
  title: string
  description: string
  value?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section className="settings-section">
      <div className="settings-row">
        <div className="min-w-0">
          <h2 className="settings-row-title">{title}</h2>
          {value ? (
            <p className="settings-row-value">{value}</p>
          ) : (
            <p className="settings-row-hint">{description}</p>
          )}
        </div>
        <button type="button" className="chip chip-square shrink-0" onClick={onToggle}>
          {open ? 'Cancel' : 'Change'}
        </button>
      </div>
      {open && <div className="settings-form">{children}</div>}
    </section>
  )
}

export default function SettingsPage() {
  const auth = useAuth()

  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSection, setOpenSection] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Change-password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Change-email / username forms (both re-authenticate with the password)
  const [emailPassword, setEmailPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [newUsername, setNewUsername] = useState('')

  // Change-phone form
  const [newPhone, setNewPhone] = useState('')
  const [newCountryCode, setNewCountryCode] = useState('IN')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneCodeSent, setPhoneCodeSent] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/account')
      if (response.status === 401) {
        auth.loginRequiredRedirect()
        return
      }
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setAccount(data)
        setNewCountryCode(data.countryCode || 'IN')
      } else {
        setError(data.detail ?? 'Could not load your account settings.')
      }
    } catch {
      setError('Could not reach the Vivah4U service.')
    } finally {
      setLoading(false)
    }
  }, [auth])

  useEffect(() => {
    void load()
  }, [load])

  function toggle(section: string) {
    setOpenSection((current) => (current === section ? '' : section))
    setError('')
    setSuccess('')
  }

  async function post(action: string, body: Record<string, unknown>) {
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/account/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) {
        setError(data.detail ?? 'Could not save that change.')
        return false
      }
      return true
    } catch {
      setError('Could not reach the Vivah4U service.')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      return
    }
    const ok = await post('password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    if (ok) {
      setSuccess('Your password has been updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setOpenSection('')
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    const ok = await post('email', { password: emailPassword, new_email: newEmail })
    if (ok) {
      setSuccess('Your email address has been updated.')
      setEmailPassword('')
      setNewEmail('')
      setOpenSection('')
      await load()
    }
  }

  async function submitUsername(e: React.FormEvent) {
    e.preventDefault()
    const ok = await post('username', {
      password: usernamePassword,
      new_username: newUsername,
    })
    if (ok) {
      setSuccess('Your username has been updated.')
      setUsernamePassword('')
      setNewUsername('')
      setOpenSection('')
      await load()
    }
  }

  async function sendPhoneCode() {
    const digits = newPhone.replace(/\D/g, '')
    if (digits.length < 6) {
      setError('Enter the new mobile number.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: digits,
          country_code: newCountryCode,
          purpose: 'phone_change',
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.detail ?? 'Could not send the code.')
        return
      }
      setNewPhone(digits)
      setPhoneCodeSent(true)
      setDevCode(data.devCode ?? null)
    } catch {
      setError('Could not reach the Vivah4U service.')
    } finally {
      setBusy(false)
    }
  }

  async function submitPhone() {
    const ok = await post('phone', {
      phone: newPhone,
      country_code: newCountryCode,
      code: phoneCode,
    })
    if (ok) {
      setSuccess('Your mobile number has been updated.')
      setPhoneCode('')
      setPhoneCodeSent(false)
      setNewPhone('')
      setOpenSection('')
      await load()
    }
  }

  if (loading) {
    return (
      <div className="settings-page">
        <p className="text-color-placeholder-text">Loading your settings…</p>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="settings-page">
        <div className="auth-alert auth-alert-error">{error || 'Could not load your account.'}</div>
        <Link href="/" className="link mt-4 inline-block">Back to home</Link>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <header className="mb-8">
        <h1 className="auth-title">Account settings</h1>
        <p className="auth-subtitle">
          Manage how you sign in. Your public profile is edited{' '}
          <Link href="/profile/me" className="link">on your profile page</Link>.
        </p>
      </header>

      {success && <div className="auth-alert auth-alert-success mb-5">{success}</div>}
      {error && !openSection && <div className="auth-alert auth-alert-error mb-5">{error}</div>}

      <div className="flex flex-col gap-4">
        <SettingsSection
          title="Username"
          description="The name you can sign in with."
          value={account.username}
          open={openSection === 'username'}
          onToggle={() => toggle('username')}
        >
          <form onSubmit={submitUsername} className="flex flex-col gap-4">
            <TextField
              id="new-username"
              label="New username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <PasswordInput
              id="username-password"
              label="Current password"
              autoComplete="current-password"
              value={usernamePassword}
              onChange={(e) => setUsernamePassword(e.target.value)}
            />
            {error && <div className="auth-alert auth-alert-error">{error}</div>}
            <button type="submit" className="btn-primary self-start" disabled={busy}>
              {busy ? 'Saving…' : 'Update username'}
            </button>
          </form>
        </SettingsSection>

        <SettingsSection
          title="Email address"
          description="Used for sign-in and account notices."
          value={account.email}
          open={openSection === 'email'}
          onToggle={() => toggle('email')}
        >
          <form onSubmit={submitEmail} className="flex flex-col gap-4">
            <TextField
              id="new-email"
              label="New email address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <PasswordInput
              id="email-password"
              label="Current password"
              autoComplete="current-password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
            />
            {error && <div className="auth-alert auth-alert-error">{error}</div>}
            <button type="submit" className="btn-primary self-start" disabled={busy}>
              {busy ? 'Saving…' : 'Update email'}
            </button>
          </form>
        </SettingsSection>

        <SettingsSection
          title="Password"
          description="Set a new password."
          value="••••••••"
          open={openSection === 'password'}
          onToggle={() => toggle('password')}
        >
          <form onSubmit={submitPassword} className="flex flex-col gap-4">
            <PasswordInput
              id="current-password"
              label="Current password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <PasswordInput
              id="new-password"
              label="New password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordInput
              id="confirm-password"
              label="Confirm new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <div className="auth-alert auth-alert-error">{error}</div>}
            <button type="submit" className="btn-primary self-start" disabled={busy}>
              {busy ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </SettingsSection>

        <SettingsSection
          title="Mobile number"
          description="Used for one-time sign-in codes."
          value={
            account.phone
              ? `${account.countryCode} ${account.phone}${account.phoneVerified ? ' · verified' : ' · unverified'}`
              : undefined
          }
          open={openSection === 'phone'}
          onToggle={() => toggle('phone')}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-36 shrink-0">
                <SelectDropdown
                  id="settings-country-code"
                  label="Country code"
                  placeholder=""
                  options={COUNTRY_CODES_OPTIONS}
                  value={newCountryCode}
                  onChange={setNewCountryCode}
                  showButtonValue
                  searchable
                  disabled={phoneCodeSent}
                />
              </div>
              <div className="min-w-0 flex-1">
                <TextField
                  id="settings-phone"
                  label="New mobile number"
                  type="tel"
                  inputMode="numeric"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                  disabled={phoneCodeSent}
                />
              </div>
            </div>

            {phoneCodeSent && (
              <>
                <OtpInput
                  id="settings-otp"
                  label="Enter the code we sent"
                  value={phoneCode}
                  onChange={setPhoneCode}
                  length={CODE_LENGTH}
                  disabled={busy}
                  autoFocus
                />
                {devCode && (
                  <div className="auth-alert">
                    <strong>Development mode.</strong> Use{' '}
                    <code className="font-semibold">{devCode}</code> to continue.
                  </div>
                )}
              </>
            )}

            {error && <div className="auth-alert auth-alert-error">{error}</div>}

            {phoneCodeSent ? (
              <button
                type="button"
                className="btn-primary self-start"
                onClick={() => void submitPhone()}
                disabled={busy || phoneCode.length !== CODE_LENGTH}
              >
                {busy ? 'Saving…' : 'Confirm new number'}
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary self-start"
                onClick={() => void sendPhoneCode()}
                disabled={busy}
              >
                {busy ? 'Sending…' : 'Send code'}
              </button>
            )}
          </div>
        </SettingsSection>
      </div>

      <section className="settings-section mt-8">
        <div className="settings-row">
          <div>
            <h2 className="settings-row-title">Sign out</h2>
            <p className="settings-row-hint">End your session on this device.</p>
          </div>
          <button type="button" className="chip chip-square shrink-0" onClick={auth.logout}>
            Sign out
          </button>
        </div>
      </section>
    </div>
  )
}
