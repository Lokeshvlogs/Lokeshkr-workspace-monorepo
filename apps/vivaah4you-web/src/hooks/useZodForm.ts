"use client"

import React, { useState } from "react"
import { z } from "zod"

export function useZodForm<T extends Record<string, any>>(
  schema: z.ZodObject<any>,
  actionFn: any,
  initialValues: Partial<T> = {},
  // Optional schema used only on submit - carries cross-field rules that cannot
  // live on a single field. Defaults to the field schema.
  submitSchema?: z.ZodType<any>
) {

  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [values, setValues] = useState<Partial<T>>(initialValues)
  const [focused, setFocused] = useState<string | null>(null)

  // returns handlers and value for wiring inputs
  function register(name: keyof T, hasPopup = false, placeholder?: string) {
    return {

      id: name as string,
      placeholder: placeholder ?? '',
      value: (values[name] ?? '') as any,
      name: name as string,
      ...((!hasPopup) ? { focuseValue: focused === name } : {}),
      ...(hasPopup ? { zIndex: 9999 - Object.keys(values).length } : {}), // ensure dropdowns are above other elements
      onChange: (e: any) => {
        // support both native events and direct value calls from custom components
        let val: any;
        if (e && typeof e === 'object' && 'target' in e && e.target && 'value' in e.target) {
          val = e.target.value;
        } else {
          val = e;
        }
        setField(name, val);
        clearFieldError(name);
      },
      onPaste: (e: any) => {
        e.preventDefault()
        const text = (e.clipboardData || (window as any).clipboardData).getData('text') || ''
        setField(name, text)
        validateField(name, text)
      },
      onFocus: () => setFocused(name as string),
      onBlur: (e: any) => {

        const val = values[name];
        console.log("Blur event for field:", name, "Value:", val);
        validateField(name, val)
        setFocused(null)
      },
    }
  }

  function setField(name: keyof T, value: any) {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  //Validate single field
  function validateField(name: keyof T, value: any) {
    const fieldSchema = schema.shape[name as string];

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

  function getFieldErrors(error: z.ZodError) : Record<string, string[]>  {
    const tree = z.treeifyError(error)

    const output: Record<string, string[]> = {}

  const properties =
    "properties" in tree
      ? (tree.properties as Record<string, { errors: string[] }>)
      : {}
 
  for (const key in properties) {
    if (properties[key].errors.length) {
      output[key] = properties[key].errors
    }
  }
    return output
  }

  async function action(formData: FormData) {

    const rawData = Object.fromEntries(formData.entries())

    const result = (submitSchema ?? schema).safeParse(values)

    if (!result.success) {
      const fieldErrors = getFieldErrors(result.error);
      console.log("Validation failed with errors", fieldErrors);
      setErrors(fieldErrors);
      return
    }

    // Validation passed - hand the parsed values to the caller. The raw FormData
    // is passed along too, but custom dropdowns never reach the DOM form, so
    // `result.data` is the authoritative payload.
    const res = await actionFn(result.data, formData)

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

  return { errors, action, validateField, clearFieldError, values, setField, focused, setFocused, register }
}

export const blockEnterKeySubmit = (e: React.KeyboardEvent<HTMLFormElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
  }
}