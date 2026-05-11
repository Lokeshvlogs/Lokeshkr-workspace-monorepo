"use server"

import { registerSchema } from "@/lib/validation/schemas/registerUserSchema"

export async function registerUser(formData: FormData) {

  const data = Object.fromEntries(formData.entries())
   console.log("Form submitted with data:", data);
  const result = registerSchema.safeParse(data)

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors
    }
  }

  console.log("User created:", result.data)

  return { success: true }
}