"use client"
import React, { useState } from 'react'
import { useAuth } from '../components/authProvider'
import SelectDropdown from '@/components/dropdown/SelectDropdown'
import { CountryCodes } from 'src/constants/selectOptions/places'
import { validateEmail } from '@/lib/validation/schemas/validateEmail'
import { registerSchema } from '@/lib/validation/schemas/registerUserSchema'
import { useZodForm } from '@/hooks/useZodForm'
import { registerUser } from '@/actions/registerUser'
import { clear } from 'console'

export default function RegisterForm() {
  const REGISTER_URL = '/api/register/'
  const auth = useAuth()

  const { errors, action, validateField, clearFieldError, values, setField, focused, setFocused, register: registerInputOnPros } = useZodForm(registerSchema, registerUser, {
  email: "",
  first_name: "",
  surname: "",
  profile_for: "",
  age: 18,
  looking_for: "",
  country_code: "",
  phone: "",
  password: "",
})
  
  const passwordProps = registerInputOnPros('password')

  const [regMessage, setRegMessage] = useState<string>('')
  const [regLoading, setRegLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [lookingForVisible, setLookingForVisible] = useState<boolean>(false)

  const handleLookingForChange = (value: string) => {
    setField('looking_for', value)
  }
  
  return (
    <form action={action} className="bg-white p-6 rounded-lg max-w-md mx-auto border-2 focus-within:ring-4 focus-within:ring-pink-50 focus-within:ring-opacity-40" style={{ boxShadow: '0 20px 40px rgba(14, 13, 13, 0.14), 0 6px 12px rgba(20, 20, 20, 0.08)'}}>
      <div className="grid grid-cols-1 gap-3">
        <input
          {...registerInputOnPros('email')}
          type="email"
          placeholder="Email-Id"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby="email-error"
          className={`p-3 text-lg border ${errors.email ? 'border-2 border-red-500' : 'border-pink-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400`}
          id="email"
        />
        {errors.email && <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">{errors.email[0]}</p>}

        <div className="grid grid-cols-2 gap-3">
          <input {...registerInputOnPros('first_name')} id='first_name' placeholder="First Name" aria-invalid={errors.first_name ? 'true' : 'false'} aria-describedby="first_name-error" className={`p-3 text-lg border ${errors.first_name ? 'border-2 border-red-500' : 'border-pink-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400`} />
          <input {...registerInputOnPros('surname')} id='surname' placeholder="Surname" aria-invalid={errors.surname ? 'true' : 'false'} aria-describedby="surname-error" className={`p-3 text-lg border ${errors.surname ? 'border-2 border-red-500' : 'border-pink-200'} rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400`} />
            {errors.first_name && <div id="first_name-error" className="text-red-500 text-sm mt-1">{errors.first_name[0]}</div>}
            {errors.surname && <div id="surname-error" className="col-start-2 text-red-500 text-sm mt-1">{errors.surname[0]}</div>}
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
            className='w-36 text-sm'
            buttonClassName='p-4 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400'
            extraLabelClassName='whitespace-nowrap'
            onChange={(value) => {
              setField('profile_for', value);
              setLookingForVisible(value === 'self');
            }}
          />
          {errors.profile_for && <div className="text-red-500 text-sm mt-1">{errors.profile_for[0]}</div>}
          <SelectDropdown
            name="Age"
            options={Array.from({length: 43}, (_,i) => {
              const v = (18 + i).toString();
              return { value: v, label: v };
            })}
            className='w-20 text-sm'
            buttonClassName='p-4 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400'
            extraLabelClassName='whitespace-nowrap'
            onChange={(value) => setField('age', parseInt(value))}
          />
          {errors.age && <div className="text-red-500 text-sm mt-1">{errors.age[0]}</div>}
          {lookingForVisible && (
            <SelectDropdown 
              name="Looking for"
              options={[{ value: 'bride', label: 'Bride' }, { value: 'groom', label: 'Groom' }]}
              className='w-40 text-sm'
              buttonClassName='p-4 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400'
              extraLabelClassName='whitespace-nowrap'
              onChange={(value) => setField('looking_for', value)}
            />
          )}
        </div>

        <div className="flex gap-3">
          <SelectDropdown
            name="Country code"
            options={CountryCodes}
            initialValue={'+91'}
            className="w-35 text-sm"
            buttonClassName='p-4 border border-pink-200 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400'
            extraLabelClassName='whitespace-nowrap'
            showButtonValue={true}
            onChange={(value) => setField('country_code', value)}
          />
          {errors.country_code && <div className="text-red-500 text-sm mt-1">{errors.country_code[0]}</div>}
          <input {...registerInputOnPros('phone')} name="phone" placeholder="Phone no." type="tel" className="p-3 border border-pink-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400" />
          {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone[0]}</div>}
        </div>

        <div className="relative">
          <input {...passwordProps} name="password" placeholder="Password" type={showPassword ? 'text' : 'password'} className="p-3 border border-pink-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400 pr-10" aria-label="Password" />
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
          {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password[0]}</div>}
        </div>

        <div className="flex items-center justify-center">
          <button type="submit" className="btn bg-brand-500 text-white mx-auto" disabled={regLoading}>{regLoading ? 'Registering...' : 'Register'}</button>
        </div>
        {regMessage && <div className="text-sm text-red-600">{regMessage}</div>}
      </div>
    </form>
  )
}
