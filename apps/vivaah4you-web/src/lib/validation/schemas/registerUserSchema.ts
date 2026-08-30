import { z } from "zod"
import { PROFILE_FOR_VALUES, LOOKING_FOR_VALUES } from "@/app/Register/constants/RegisterUserOptions"
import { COUNTRY_DIAL_CODES } from "@/constants/selectOptions/places"

const emptyToUndefined = (val: unknown) => {
  if (typeof val === 'string' && val.trim() === '') return undefined
  return val
}

// The old rule was /^[A-Za-z]+$/, which rejected every space, hyphen and
// apostrophe - "Ram Kumar", "Anne-Marie" and "D'Souza" could not sign up at all.
// \p{L} also admits accented and non-Latin scripts. Still anchored on a letter,
// so a name cannot be punctuation alone.
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}\s'’.-]*$/u
const NAME_MESSAGE = "Use letters, spaces, hyphens or apostrophes."

// Field-level schema: keeps `.shape` reachable so useZodForm can validate one
// input at a time on blur.
export const registerFieldSchema = z.object({
  email: z.string().email("Invalid email"),
  first_name: z.string().trim().min(1, "First name must be at least 1 character").regex(NAME_PATTERN, NAME_MESSAGE),
  surname: z.string().trim().min(1, "Surname must be at least 1 character").regex(NAME_PATTERN, NAME_MESSAGE),
  profile_for: z.preprocess(emptyToUndefined, z.enum(PROFILE_FOR_VALUES).optional().refine((val) => val !== undefined, {
    message: "Please select a profile for",
  })),

  age: z.coerce.number({
    error: (iss) => {
      return "Please select an age";
    }
  })
    .int()
    .min(18, "Age must be at least 18")
    .max(60, "Age must be less than 60"),

  // Only asked when the profile is the user's own - the cross-field rule below
  // enforces it for profile_for === "self" and leaves it optional otherwise.
  looking_for: z.preprocess(emptyToUndefined, z.enum(LOOKING_FOR_VALUES).optional()),

  country_code: z.preprocess(emptyToUndefined, z.enum(Object.keys(COUNTRY_DIAL_CODES)).optional().refine((val) => val !== undefined, {
    message: "Please select a country",
  })),

  phone: z.preprocess(emptyToUndefined,
    z.string({
      // This function catches the 'undefined' produced by your preprocess
      error: (issue) => issue.input === undefined ? "Please enter a Phone number" : "Invalid Phone number"
    })
      // 9-10 digits was India's mobile shape, applied regardless of the country
      // code chosen right next to it. This range covers the dial codes the form
      // already offers (UK national numbers run to 11, for instance).
      .regex(/^\d+$/, "Phone number must contain only digits")
      .min(7, "Phone number must be at least 7 digits")
      .max(15, "Phone number must not exceed 15 digits")),

  password: z.preprocess(emptyToUndefined,
    z.string({
      // This function catches the 'undefined' produced by your preprocess
      error: (issue) => issue.input === undefined ? "Please enter a Password" : "Invalid Password"
    })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters")),
})

// Submit-time schema: adds the cross-field rule that cannot live on a single field.
export const registerSchema = registerFieldSchema.superRefine((data, ctx) => {
  if (data.profile_for === 'self' && !data.looking_for) {
    ctx.addIssue({
      code: 'custom',
      path: ['looking_for'],
      message: "Please select what you are looking for",
    })
  }
})

export type RegisterSchema = z.infer<typeof registerFieldSchema>
