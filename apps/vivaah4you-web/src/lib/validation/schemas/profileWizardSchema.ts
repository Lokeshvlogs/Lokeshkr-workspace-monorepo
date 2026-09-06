import { z } from "zod"

import { CONTACT_MESSAGE, hasContactDetails, NAME_MESSAGE, NAME_PATTERN } from "@/lib/validation/rules"

/**
 * The wizard fields whose rule is more than "must not be empty".
 *
 * Kept field-level (one entry per input, no cross-field refinements) so the
 * wizard can parse a single value at a time and put the message on the control
 * that produced it - the same shape `registerFieldSchema` uses for the same
 * reason.
 *
 * Everything else the wizard requires is a plain presence check and lives in
 * `gapsOn` in the register page, where the conditional cases (a follow-up that
 * only some answers ask for, a residency list that some countries do not have)
 * can see the rest of the form.
 */

/**
 * "Required" rather than a length message: in the wizard a blank name is simply
 * an unanswered field, and it is marked alongside every other blank on the step.
 * The pattern message still carries the detail when the name is present but
 * malformed.
 */
const nameField = z.string().trim().min(1, "Required").regex(NAME_PATTERN, NAME_MESSAGE)

/**
 * A free-text box that must not be used to pass on contact details.
 *
 * Empty passes - all three of these boxes are optional, and the rule is about
 * what they may contain, not whether they are filled.
 */
const freeText = z.string().refine((value) => !hasContactDetails(value), CONTACT_MESSAGE)

export const wizardFieldSchema = z.object({
  firstName: nameField,
  surname: nameField,
  aboutMe: freeText,
  familyAbout: freeText,
  partnerAbout: freeText,
})

export type WizardValidatedField = keyof typeof wizardFieldSchema.shape

/**
 * The first complaint about a value, or undefined when it passes.
 *
 * Returns the message rather than the ZodError so the caller can drop it
 * straight into the same field-key map the presence checks build.
 */
export function fieldIssue(field: WizardValidatedField, value: string): string | undefined {
  const result = wizardFieldSchema.shape[field].safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}
