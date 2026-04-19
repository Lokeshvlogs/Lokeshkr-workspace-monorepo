"use client"
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../components/authProvider'
import { TextField } from '@/components/input/text/TextField'
import { PasswordInput } from '@/components/input/text/Password'
import SelectDropdown from '@/components/input/dropdown/SelectDropdown'
import { COUNTRY_CODES_OPTIONS } from 'src/constants/selectOptions/places'
import { registerSchema } from '@/lib/validation/schemas/registerUserSchema'
import { useZodForm, blockEnterKeySubmit } from '@/hooks/useZodForm'
import { registerUser } from '@/actions/registerUser'
import { Eye, EyeOff } from "lucide-react";
import { PROFILE_FOR_OPTIONS, LOOKING_FOR_OPTIONS, AGE_OPTIONS } from './constants/RegisterUserOptions'

export default function RegisterForm() {
  const REGISTER_URL = '/api/register/'
  const auth = useAuth()

  const { errors, action, validateField, clearFieldError, values, setField, focused, setFocused, register: registerFormInput } = useZodForm(registerSchema, registerUser, {
    email: "",
    first_name: "",
    surname: "",
    profile_for: undefined,
    age: undefined,
    looking_for: undefined,
    country_code: "IN",
    phone: undefined,
    password: undefined,
  })

  const passwordProps = registerFormInput('password')

  const [regMessage, setRegMessage] = useState<string>('')
  const [regLoading, setRegLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [lookingForVisible, setLookingForVisible] = useState<boolean>(false)

  useEffect(() => {
    if (values?.profile_for === 'self') {
      setLookingForVisible(true)
    } else {
      setLookingForVisible(false)
      setField('looking_for', undefined)
      clearFieldError('looking_for')
    }
  }, [values.profile_for])

  return (
    <form action={action} className="bg-white p-6 rounded-lg max-w-md mx-auto border-2 focus-within:ring-4 focus-within:ring-pink-50 focus-within:ring-opacity-40" style={{ boxShadow: '0 20px 40px rgba(14, 13, 13, 0.14), 0 6px 12px rgba(20, 20, 20, 0.08)' }} onKeyDown={blockEnterKeySubmit}>
      <div className="grid grid-cols-1 gap-3">
        <div className="relative mt-6">
          <TextField
            {...registerFormInput('email')}
            label="Email"
            type='email'
            placeholder=""
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby="email-error"
            className={`input ${errors.email ? 'input-error' : ''}`}
          />
        {errors.email && <p id="email-error" className="error-text" role="alert">{errors.email[0]}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            {...registerFormInput('first_name')}
            id='first_name'
            placeholder="First Name"
            aria-invalid={errors.first_name ? 'true' : 'false'}
            aria-describedby="first_name-error"
            className={`input ${errors.first_name ? 'input-error' : ''}`}
          />
          <input
            {...registerFormInput('surname')}
            id='surname'
            placeholder="Surname"
            aria-invalid={errors.surname ? 'true' : 'false'}
            aria-describedby="surname-error"
            className={`input ${errors.surname ? 'input-error' : ''}`}

          />
          {errors.first_name && <p id="first_name-error" className="error-text" role="alert">{errors.first_name[0]}</p>}
          {errors.surname && <p id="surname-error" className="col-start-2 error-text" role="alert">{errors.surname[0]}</p>}
        </div>

        <div className="grid grid-cols-[2fr_1fr_2fr] gap-3">
          <SelectDropdown
            {...registerFormInput('profile_for')}
            placeholder="Profile for"
            options={PROFILE_FOR_OPTIONS}
            className={`select-button ${errors.profile_for ? 'select-error' : ''}`}
            selectPopupClassName='z-20'
            extraLabelClassName='whitespace-nowrap'
          />
          <SelectDropdown
            {...registerFormInput('age')}
            placeholder="Age"
            options={AGE_OPTIONS}
            className={`select-button ${errors.age ? 'select-error' : ''}`}
            selectLabelClassName='mr-1'
            selectPopupClassName='z-20'
            extraLabelClassName='whitespace-nowrap'
          />
          {lookingForVisible && (
            <SelectDropdown
              {...registerFormInput('looking_for')}
              placeholder="Looking for"
              options={LOOKING_FOR_OPTIONS}
              className={`select-button ${errors.looking_for ? 'select-error' : ''}`}
              selectPopupClassName='z-20'
              extraLabelClassName='whitespace-nowrap'
            />
          )}
          {errors.profile_for && <p id='profile-for-error' className="row-start-2 error-text" role='alert'>{errors.profile_for[0]}</p>}
          {errors.age && <p id='age-error' className="col-start-2 error-text" role='alert'>{errors.age[0]}</p>}
          {lookingForVisible && errors.looking_for && <p id='looking_for-error' className="col-start-3 error-text" role='alert'>{errors.looking_for[0]}</p>}
        </div>

        <div className="flex gap-3 items-start">

          {/* 🔹 Country Code */}
          <div className="flex flex-col shrink-0">
            <SelectDropdown
              {...registerFormInput('country_code')}
              placeholder="Country code"
              options={COUNTRY_CODES_OPTIONS}
              className={`select-button max-w-[200px] ${errors.country_code ? 'select-error' : ''}`}
              showButtonValue={true}
              extraLabelClassName="whitespace-nowrap"
              selectPopupClassName='z-10'
            />
            {errors.country_code && (
              <p className="error-text mt-1" role="alert">
                {errors.country_code[0]}
              </p>
            )}
          </div>

          {/* 🔹 Phone Input */}
          <div className="flex flex-col flex-1 min-w-0">
            <input
              {...registerFormInput('phone')}
              placeholder="Phone no."
              type="tel"
              className={`input w-full ${errors.phone ? 'input-error' : ''}`}
            />
            {errors.phone && (
              <p className="error-text mt-1" role="alert">
                {errors.phone[0]}
              </p>
            )}
          </div>

        </div>

        <div className="relative">
          <input {...passwordProps} name="password" placeholder="Password" type={showPassword ? 'text' : 'password'} className="p-3 border border-pink-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-gray-400 pr-10" aria-label="Password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-2 flex items-center text-gray-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
