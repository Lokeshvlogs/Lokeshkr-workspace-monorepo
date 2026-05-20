"use client"
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../components/authProvider'
import { PasswordInput, SelectDropdown, TextField } from '@lokesh-workspace/ui'
import { COUNTRY_CODES_OPTIONS } from '@/constants/selectOptions/places'
import { registerSchema } from '@/lib/validation/schemas/registerUserSchema'
import { useZodForm, blockEnterKeySubmit } from '@/hooks/useZodForm'
import { registerUser } from '@/actions/registerUser'
import { Eye, EyeOff } from "lucide-react";
import { PROFILE_FOR_OPTIONS, LOOKING_FOR_OPTIONS, AGE_OPTIONS } from './constants/RegisterUserOptions'

export default function RegisterForm() {
  const REGISTER_URL = '/api/register/'
  const auth = useAuth()

  const { errors, action, validateField, clearFieldError, values, setField, focused, setFocused, register: registerInputProps } = useZodForm(registerSchema, registerUser, {
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

  const passwordProps = registerInputProps('password')

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
            {...registerInputProps('email')}
            label="Email"
            type='email'
            errorValue={errors.email ? errors.email[0] : undefined}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            {...registerInputProps('first_name')}
            label="First Name"
            errorValue={errors.first_name ? errors.first_name[0] : undefined}
          />
          <TextField
            {...registerInputProps('surname')}
            label="Surname"
            errorValue={errors.surname ? errors.surname[0] : undefined}
          />
        </div>

        <div className="flex justify-start gap-4">
          <SelectDropdown
            {...registerInputProps('profile_for', true)}
            placeholder=""
            label="Profile for"
            options={PROFILE_FOR_OPTIONS}
            errorValue={errors.profile_for ? errors.profile_for[0] : undefined}
            PlaceHolderX={2}
            LabelX={-5}
          />
          <SelectDropdown
            {...registerInputProps('age', true)}
            placeholder=""
            label="Age"
            options={AGE_OPTIONS}
            errorValue={errors.age ? errors.age[0] : undefined}
            selectLabelClassName='mr-1'
          />
          {lookingForVisible && (
            <SelectDropdown
              {...registerInputProps('looking_for', true)}
              label="Looking for"
              options={LOOKING_FOR_OPTIONS}
              errorValue={errors.looking_for ? errors.looking_for[0] : undefined}
              PlaceHolderX={-5}
              LabelX={-5}
              className="w-[550px]"
            />
          )}
        </div>

        <div className="flex gap-3 items-start">

          {/* 🔹 Country Code */}
          <div className="flex flex-col shrink-0">
            <SelectDropdown
              {...registerInputProps('country_code', true)}
              label="Country code"
              options={COUNTRY_CODES_OPTIONS}
              errorValue={errors.country_code ? errors.country_code[0] : undefined}
              showButtonValue={true}
              LabelX={-10}
            />
          </div>

          {/* 🔹 Phone Input */}
          <div className="flex flex-col flex-1 min-w-0">
            <TextField
              {...registerInputProps('phone')}
              label="Phone number"
              type="tel"
              errorValue={errors.phone ? errors.phone[0] : undefined}
            />
          </div>

        </div>
        <div className="relative">
          <PasswordInput
            {...registerInputProps('password')}
            label="Password"
            errorValue={errors.password ? errors.password[0] : undefined}
            LabelX={15}
            LabelY={-12}
            PlaceholderX={10}
            PlaceholderY={10}
          />
        </div>

        <div className="flex items-center justify-center">
          <button type="submit" className="btn-primary" disabled={regLoading}>{regLoading ? 'Registering...' : 'Register'}</button>
        </div>
        {regMessage && <div className="text-sm text-red-600">{regMessage}</div>}
      </div>
    </form>
  )
}
