import { z } from 'zod'

const emailSchema = z.string().regex(
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  "Invalid email address"
);

export function validateEmail(value: string): { valid: true } | { valid: false; error: string } {
  const result = emailSchema.safeParse(value)
  if (result.success) return { valid: true }
  const err = result.error.issues[0]?.message || 'Invalid email'
  return { valid: false, error: err }
}

export default validateEmail
