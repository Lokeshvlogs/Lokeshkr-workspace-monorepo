"use client"

import { useState } from "react"
import { ZodSchema } from "zod"

export function useZodForm<T extends Record<string, any>>(
  schema: ZodSchema<T>,
  actionFn: any,
  initialValues: Partial<T> = {},
) {

  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [values, setValues] = useState<Partial<T>>(initialValues)
  const [focused, setFocused] = useState<string | null>(null)

  function setField(name: keyof T, value: any) {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
    // 🔥 Validate single field
  function validateField(name: keyof T, value: any) {
    const fieldSchema = (schema as any).shape?.[name]

    if (!fieldSchema) return

    const result = fieldSchema.safeParse(value)

    setErrors((prev) => {
      const newErrors = { ...prev }

    if (!result.success) {
      const message = result.error.issues?.[0]?.message

      if (message) {
        newErrors[name as string] = [message]
      }
    } else {
      delete newErrors[name as string]
    }

    return newErrors
    })
  }
  async function action(formData: FormData) {

    const rawData = Object.fromEntries(formData.entries())

    const result = schema.safeParse(rawData)

    if (!result.success) {

      const fieldErrors = result.error.flatten().fieldErrors
      setErrors(fieldErrors as Record<string, string[]>)

      return
    }

    const res = await actionFn(formData)

    if (res?.errors) {
      setErrors(res.errors)
    }
  }

  function clearFieldError(name: keyof T) {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[name as string]
      return newErrors
    })
  }

  return { errors, action, validateField, clearFieldError, values, setField, focused, setFocused }
}