import { z } from "zod"
import { PROFILE_FOR_VALUES, LOOKING_FOR_VALUES } from "src/app/Register/constants/RegisterUserOptions"

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  first_name: z.string().min(1, "First name must be at least 1 character"),
  surname: z.string().min(1, "Surname must be at least 1 character"),
  profile_for: z.enum(PROFILE_FOR_VALUES).optional().refine((val) => val !== undefined, {
    message: "Please select a profile for",
  }),
  age: z.number().int().min(18, "You must be at least 18 years old").max(60, "Age must be less than 60").optional().refine((val) => val !== undefined, {
    message: "Please select age",
  }),
  looking_for: z.enum(LOOKING_FOR_VALUES).optional().refine((val) => val !== undefined, {
    message: "Please select what you are looking for",
  }),
  country_code: z.string().min(2, "Select a country"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be less than 15 digits"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters"),
})

export type RegisterSchema = z.infer<typeof registerSchema>