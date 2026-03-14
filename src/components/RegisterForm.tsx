"use client"
import React, { useState } from 'react'
import { useAuth } from '../components/authProvider'
import ScrollableDropdown from '@/components/dropdown/ScrollableDropdown'
import SelectDropdown from '@/components/dropdown/SelectDropdown'
import { CountryCodes } from 'src/constants/selectOptions/places'
import { validateEmail } from '@/lib/validate'

export default function RegisterForm() {
  const REGISTER_URL = '/api/register/'
  const auth = useAuth()

  
  
  const [email, setEmail] = useState<string>('')
  const [emailFocused, setEmailFocused] = useState<boolean>(false)
  const [error, setError] = useState<{ valid: boolean; error?: string } | null>(null)
  const [regMessage, setRegMessage] = useState<string>('')
  const [regLoading, setRegLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [countryCodeValue, setCountryCodeValue] = useState<string>('+91')
  
  const [lookingFor, setLookingFor] = useState<string>('bride')
  const [age, setAge] = useState<number>(25)
  const [lookingForVisible, setLookingForVisible] = useState<boolean>(false)
  const [profileFor, setProfileFor] = useState<string>('son')

  const handleEmailChange = (s: string) => {
    const value = s.replace(/[^a-zA-Z0-9@._-]/g, '')
    const atCount = (value.match(/@/g) || []).length
    if (atCount > 1) return
    setEmail(value)
    if (value === '') setError(null)
  }

  const handleLookingForChange = (value: string) => {
    setLookingFor(value)
  }
  
  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRegMessage('')
    setRegLoading(true)

    const formData = new FormData(event.currentTarget as HTMLFormElement)
    const dataObject: any = Object.fromEntries(formData as any)
    if (dataObject.country_code) {
      dataObject.phone = `${dataObject.country_code}${dataObject.phone || ''}`
      delete dataObject.country_code
    }
    const jsonData = JSON.stringify(dataObject)

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonData,
    }

    try {
      const response = await fetch(REGISTER_URL, requestOptions)
      let data: any = {}
      try {
        data = await response.json()
      } catch {}

      if (response.ok) {
        auth.loginRequiredRedirect()
      } else {
        setRegMessage(data?.error || 'Registration failed.')
      }
    } catch (err) {
      setRegMessage('Network error.')
    }

    setRegLoading(false)
  }

  return (
    <form onSubmit={handleRegister} className="bg-white p-6 rounded-lg max-w-md mx-auto border-2 focus-within:ring-4 focus-within:ring-pink-50 focus-within:ring-opacity-40" style={{ boxShadow: '0 20px 40px rgba(14, 13, 13, 0.14), 0 6px 12px rgba(20, 20, 20, 0.08)'}}>
      <div className="grid grid-cols-1 gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email-Id"
          aria-invalid={error ? 'true' : 'false'}
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          onPaste={(e) => {
            e.preventDefault()
            const text = (e.clipboardData || (window as any).clipboardData).getData('text') || ''
            handleEmailChange(text)
          }}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => {
            setEmailFocused(false)
            if (email.trim() === '') { setError(null); return }
            const res = validateEmail(email)
            if (res.valid) setError({ valid: true })
            else setError({ valid: false, error: res.error })
          }}
          className={`p-3 text-lg rounded-md placeholder-gray-400 ${emailFocused ? 'border-2 border-pink-200' : error && !error.valid ? 'border-2 border-red-500' : 'border border-pink-200'} focus:outline-none`}
        />
        {error && <div className="text-red-500 text-sm mt-1">{error.error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <input name="first_name" placeholder="First Name" className="p-3 text-lg border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400" />
          <input name="last_name" placeholder="Last Name" className="p-3 text-lg border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400" />
        </div>

        <div className="flex gap-3">
          <SelectDropdown
            name="Profile for"
            options={[
              { value: 'son', label: 'Son' },
              { value: 'daughter', label: 'Daughter' },
              { value: 'brother', label: 'Brother' },
              { value: 'sister', label: 'Sister' },
              { value: 'self', label: 'Self' },
            ]}
            className='w-36'
            buttonClassName='p-4 text-lg border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400'
            buttonLabelClassName='text-lg'
            extraLabelClassName='whitespace-nowrap'
            onChange={(value) => {
              setProfileFor(value);
              setLookingForVisible(value === 'self');
            }}
          />
          <SelectDropdown
            name="Age"
            options={Array.from({length: 43}, (_,i) => {
              const v = (18 + i).toString();
              return { value: v, label: v };
            })}
            className='w-20'
            buttonClassName='p-4 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400'
            buttonLabelClassName='text-lg'
            extraLabelClassName='whitespace-nowrap'
            onChange={(value) => setAge(parseInt(value))}
          />
          <input type="hidden" name="age" value={age} />
          {lookingForVisible && (
            <SelectDropdown 
              name="Looking for"
              options={[{ value: 'bride', label: 'Bride' }, { value: 'groom', label: 'Groom' }]}
              className='w-40'
              buttonClassName='p-4 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400'
              extraLabelClassName='whitespace-nowrap'
              onChange={handleLookingForChange}
            />
          )}
        </div>

        <div className="flex gap-3">
          <SelectDropdown
            name="Country code"
            options={CountryCodes}
            initialValue={'+91'}
            showButtonValue={true}
            className="w-35"
            buttonClassName='p-4 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400'
            extraLabelClassName='whitespace-nowrap'
            onChange={(value) => setCountryCodeValue(value)}
          />

          <input name="phone" placeholder="Phone no." type="tel" className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400" />
        </div>

        <div className="relative">
          <input
            name="password"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400 pr-10"
            aria-label="Password"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-2 flex items-center text-gray-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.071-5.86M6.06 6.06A9.96 9.96 0 0112 5c5.523 0 10 4.477 10 10 0 1.035-.164 2.031-.475 2.958M3 3l18 18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center">
          <button type="submit" className="btn bg-brand-500 text-white mx-auto" disabled={regLoading}>{regLoading ? 'Registering...' : 'Register'}</button>
        </div>
        {regMessage && <div className="text-sm text-red-600">{regMessage}</div>}
      </div>
    </form>
  )
}
