import { z } from "zod"
import { PROFILE_FOR_VALUES, LOOKING_FOR_VALUES } from "src/app/Register/constants/RegisterUserOptions"
import { COUNTRY_DIAL_CODES} from "src/constants/selectOptions/places"

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  first_name: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined
    return val
  }, z.string().regex(/^[A-Za-z]+$/, "Must be Alphabets only.").min(1, "First name must be at least 1 character")),
  surname: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined
    return val
  }, z.string().regex(/^[A-Za-z]+$/, "Must be Alphabets only.").min(1, "Surname must be at least 1 character")),
  profile_for: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined
    return val
  }, z.enum(PROFILE_FOR_VALUES).optional().refine((val) => val !== undefined , {
    message: "Please select a profile for",
  })),

  age: z.number({
  error: (iss) => {
    console.log("Value received:", iss.input, "Type:", typeof iss.input);
    return "Please select an age";
  }
})
  .int()
  .min(18, "Age must be at least 18")
  .max(60, "Age must be less than 60"),

  looking_for: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined
    return val
  }, z.enum(LOOKING_FOR_VALUES).optional().refine((val) => val !== undefined, {
    message: "Please select what you are looking for",
  })),
  country_code: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined
    return val
  }, z.enum(Object.keys(COUNTRY_DIAL_CODES)).optional().refine((val) => val !== undefined, {
    message: "Please select a country",
  })),
  phone: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined
    return val
  }, z.string().regex(/^\d+$/, "Phone number must contain only digits").min(9, "Phone number must be at least 9 digits").max(10, "Phone number must not exceed 10 digits")),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters"),
})

export type RegisterSchema = z.infer<typeof registerSchema>