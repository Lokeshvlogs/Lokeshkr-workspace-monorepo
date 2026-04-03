"use client"
import React, { useState } from 'react'
import { useAuth } from '../../components/authProvider'
import SelectDropdown from '@/components/dropdown/SelectDropdown'
import { CountryCodes } from 'src/constants/selectOptions/places'
import { validateEmail } from '@/lib/validation/schemas/validateEmail'
import { registerSchema } from '@/lib/validation/schemas/registerUserSchema'
import { useZodForm } from '@/hooks/useZodForm'
import { registerUser } from '@/actions/registerUser'
import { clear } from 'console'
import { PROFILE_FOR_OPTIONS, LOOKING_FOR_OPTIONS, AGE_OPTIONS } from './constants/RegisterUserOptions'

export default function RegisterForm() {
  const REGISTER_URL = '/api/register/'
  const auth = useAuth()

  const { errors, action, validateField, clearFieldError, values, setField, focused, setFocused, register: registerInput } = useZodForm(registerSchema, registerUser, {
  email: "",
  first_name: "",
  surname: "",
  profile_for: undefined,
  age: undefined,
  looking_for: undefined,
  country_code: "",
  phone: undefined,
  password: undefined,
})
  
  const passwordProps = registerInput('password')

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
          {...registerInput('email')}
          id="email"
          type="email"
          placeholder="Email-Id"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby="email-error"
          className={`input ${errors.email ? 'input-error' : ''}`}
        />
        {errors.email && <p id="email-error" className="error-text" role="alert">{errors.email[0]}</p>}

        <div className="grid grid-cols-2 gap-3">
          <input 
            id='first_name' 
            placeholder="First Name" 
            aria-invalid={errors.first_name ? 'true' : 'false'} 
            aria-describedby="first_name-error" 
            className={`input ${errors.first_name ? 'input-error' : ''}`} 
            {...registerInput('first_name')}
          />
          <input 
            id='surname' 
            placeholder="Surname" 
            aria-invalid={errors.surname ? 'true' : 'false'} 
            aria-describedby="surname-error" 
            className={`input ${errors.surname ? 'input-error' : ''}`} 
            {...registerInput('surname')}
          />
            {errors.first_name && <p id="first_name-error" className="error-text" role="alert">{errors.first_name[0]}</p>}
            {errors.surname && <p id="surname-error" className="col-start-2 error-text" role="alert">{errors.surname[0]}</p>}
          </div>

        <div className="grid grid-cols-[2fr_1fr_2fr] gap-3">
          <SelectDropdown
           {...registerInput('profile_for')}
            placeholder="Profile for"
            options={PROFILE_FOR_OPTIONS}
            className={`select-wrapper ${errors.profile_for ? 'select-error' : ''}`}
            buttonClassName='select-button'
            extraLabelClassName='whitespace-nowrap'
          />
          <SelectDropdown
            {...registerInput('age')}
            placeholder="Age"
            options={AGE_OPTIONS}
            className={`select-wrapper ${errors.age ? 'select-error' : ''}`}
            buttonClassName='select-button'
            extraLabelClassName='whitespace-nowrap'
          />
          {lookingForVisible && (
            <SelectDropdown
              {...registerInput('looking_for')}
              placeholder="Looking for"
              options={LOOKING_FOR_OPTIONS}
              className={`select-wrapper ${errors.looking_for ? 'select-error' : ''}`}
              buttonClassName='select-button'
              extraLabelClassName='whitespace-nowrap'
            />
          )}
          {errors.profile_for && <p id='profile-for-error' className="row-start-2 error-text" role='alert'>{errors.profile_for[0]}</p>}
          {errors.age && <p id='age-error' className="col-start-2 error-text" role='alert'>{errors.age[0]}</p>}
          {lookingForVisible && errors.looking_for && <p id='looking_for-error' className="col-start-3 error-text" role='alert'>{errors.looking_for[0]}</p>}
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <SelectDropdown
            placeholder="Country code"
            options={CountryCodes}
            initialValue={'+91'}
            className={`select-wrapper ${errors.country_code ? 'select-error' : ''}`}
            buttonClassName='select-button'
            extraLabelClassName='whitespace-nowrap'
            showButtonValue={true}
            {...registerInput('country_code')}
          />
          <input {...registerInput('phone')} name="phone" placeholder="Phone no." type="tel" className={`input ${errors.phone ? 'input-error' : ''}`} />
          {errors.country_code && <p id='country-code-error' className="row-start-2 error-text" role='alert'>{errors.country_code[0]}</p>}
          {errors.phone && <p id='phone-error' className="col-start-2 col-span-2 error-text" role='alert'>{errors.phone[0]}</p>}
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
          {errors.password && <p id='password-error' className="text-red-500 text-sm mt-1" role='alert'>{errors.password[0]}</p>}
        </div>

        <div className="flex items-center justify-center">
          <button type="submit" className="btn-primary" disabled={regLoading}>{regLoading ? 'Registering...' : 'Register'}</button>
        </div>
        {regMessage && <div className="text-sm text-red-600">{regMessage}</div>}
      </div>
    </form>
  )
}
