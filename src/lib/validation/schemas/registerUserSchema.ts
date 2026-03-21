import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  surname: z.string().min(2, "Surname must be at least 2 characters"),
  profile_for: z.string().min(1, "Please select a profile for"),
  age: z.number().int().min(18, "You must be at least 18 years old").max(60, "Age must be less than 60"),
  looking_for: z.string().optional(),
  country_code: z.string().min(2, "Please select a country"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be less than 15 digits"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters"),
})

export type RegisterSchema = z.infer<typeof registerSchema>