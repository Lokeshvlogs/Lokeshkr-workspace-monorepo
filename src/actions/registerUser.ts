"use server"

import { registerSchema } from "@/lib/validation/schemas/registerUserSchema"

export async function registerUser(formData: FormData) {

  const data = {
    name: formData.get("name"),
    email: formData.get("email"),
    country: formData.get("country"),
  }

  const result = registerSchema.safeParse(data)

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors
    }
  }

  console.log("User created:", result.data)

  return { success: true }
}