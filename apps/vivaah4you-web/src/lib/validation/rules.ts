/**
 * Field rules shared by more than one form.
 *
 * These live apart from any one schema because the sign-up form and the profile
 * wizard ask for the same things: a name typed twice under two different rules
 * is a bug waiting to happen, and a member who signs up as "D'Souza" must not be
 * told the same surname is invalid three screens later.
 */

// The old rule was /^[A-Za-z]+$/, which rejected every space, hyphen and
// apostrophe - "Ram Kumar", "Anne-Marie" and "D'Souza" could not sign up at all.
// \p{L} also admits accented and non-Latin scripts. Still anchored on a letter,
// so a name cannot be punctuation alone.
export const NAME_PATTERN = /^\p{L}[\p{L}\p{M}\s'’.-]*$/u
export const NAME_MESSAGE = "Use letters, spaces, hyphens or apostrophes."

/* ------------------------------------------------------------------ *
 * Contact details in free text
 * ------------------------------------------------------------------ */

/**
 * Members trade phone numbers and email addresses in the "about" boxes to move
 * the conversation off the platform, which takes the safety and moderation the
 * site provides with it. The obvious forms are easy to spot, so people reach
 * for spacing and spelling instead - "nine eight seven ...", "name at gmail dot
 * com", "9968 26 14 and 19", "name@gmail . c o m" - and those are what this is
 * really aimed at.
 *
 * This is a deterrent, not a guarantee. It is deliberately tuned to miss rather
 * than to over-block: a false positive tells someone their honest paragraph is
 * forbidden and gives them no way to word it differently, which is worse than
 * letting an ingenious spelling through.
 */

const DIGIT_WORDS: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  // "oh" for zero is deliberately absent - it is far too common in ordinary
  // prose to spend on a rule this blunt.
}

const DIGIT_WORD_PATTERN = new RegExp(`\\b(${Object.keys(DIGIT_WORDS).join('|')})\\b`, 'gi')

/** The shortest real phone number, so anything below this is a year or a count. */
const PHONE_MIN_DIGITS = 7

/**
 * A digit run held together only by the punctuation phone numbers use. "+91 98
 * 765-43210" is one run; "born 1990, 2 brothers" is not, because the letters
 * between the numbers break it.
 */
const PHONE_RUN = /\+?\d[\d\s().+-]{4,}\d/g

/**
 * Filler words used to break a number up so it stops looking like one -
 * "9968 26 14 and 19". Collapsed only where they sit BETWEEN two digits, so
 * ordinary prose either side of a number is left alone.
 */
const DIGIT_JOINER = /(\d)\s*\b(?:and|dash|hyphen|space|point)\b\s*(\d)/gi

/** 1800-2099, the range a written year realistically falls in. */
const YEAR = /^(?:1[89]\d{2}|20\d{2})$/

/**
 * Joiners are collapsed one pass at a time because each match consumes the
 * digit that starts the next one - "1 and 2 and 3" needs two passes. Bounded so
 * a pathological input cannot spin here.
 */
function collapseJoiners(text: string): string {
  let current = text
  for (let pass = 0; pass < 8; pass += 1) {
    const next = current.replace(DIGIT_JOINER, '$1 $2')
    if (next === current) break
    current = next
  }
  return current
}

/** Whether one digit run is long enough, and shaped enough, to be a number. */
function looksLikePhone(run: string): boolean {
  const groups = run.match(/\d+/g) ?? []
  if (groups.join('').length < PHONE_MIN_DIGITS) return false
  // A string of four-digit years - "1990 and 2015 and 2019" - is a life story,
  // not a phone number. No real number is made solely of them.
  if (groups.every((group) => YEAR.test(group))) return false
  return true
}

/**
 * A short token wrapped in brackets, as used to hide a separator from a naive
 * scan: "[@]", "(at)", "[.]", "gmail[dot]com", ".[com]".
 *
 * Unwrapping it first means every later rule sees the plain form and none of
 * them needs a bracketed variant of its own.
 */
const BRACKETED_TOKEN = /[([{]\s*([\p{L}\d.@_-]{1,6})\s*[)\]}]/gu

/**
 * The brackets become spaces rather than vanishing. Dropping them outright
 * welds the token to its neighbours - "asha(at)gmail" would collapse to
 * "ashaatgmail", where the word boundaries the "at" rule needs no longer exist.
 */
const unwrapBrackets = (text: string): string => text.replace(BRACKETED_TOKEN, ' $1 ')

/**
 * The at sign in any form, once brackets are off.
 *
 * Blocked outright rather than only as part of a full address: no spacing trick
 * survives it, and the sign has no other use in a paragraph about yourself. It
 * is the one rule here that does not try to be clever.
 */
const AT_SIGN = /[@＠]/u

/**
 * "name at gmail dot com" - the same address with the sign spelled out.
 *
 * The separator words must be surrounded by the shape of an address for this to
 * fire, so "meet me at the dot on the map" stays fine.
 */
const OBFUSCATED_EMAIL =
  /[\p{L}\d._%+-]{2,}\s*\bat\b\s*[\p{L}\d.-]{2,}\s*(?:\.|\bdot\b)\s*\p{L}{2,}/iu

/**
 * Three or more single letters separated by spaces - "c o m", "g m a i l".
 * Two is not enough: "a b" turns up in ordinary writing, "c o m" does not.
 */
const SPACED_LETTERS = /\b(?:\p{L}\s+){2,}\p{L}\b/gu

/**
 * Undo the spacing used to break an address apart: "lokesh @ g m a i l . c o m".
 *
 * Whitespace is closed up only around a dot and inside a spelled-out word, not
 * everywhere - collapsing the whole string would run unrelated sentences
 * together and invent addresses that were never written.
 */
function normaliseForEmail(text: string): string {
  return text
    .replace(SPACED_LETTERS, (run) => run.replace(/\s+/g, ''))
    .replace(/\s*\.\s*/g, '.')
}

export const CONTACT_MESSAGE =
  "Please remove phone numbers, email addresses and the “@” symbol — keep the conversation on Vivah4U."

/**
 * Whether the text appears to carry a phone number or an email address.
 *
 * Everything is normalised before it is tested rather than each rule growing
 * its own variants: brackets come off, digit words become digits, joiner words
 * between digits close up, and spelled-out domains are put back together. The
 * spaced, spelled and bracketed spellings then all meet the same few rules.
 */
export function hasContactDetails(text: string): boolean {
  if (!text) return false

  const unwrapped = unwrapBrackets(text)

  // Catches every "@" spelling at once - bare, spaced, or bracketed - which is
  // why there is no full-address pattern here any more.
  if (AT_SIGN.test(unwrapped)) return true

  if (OBFUSCATED_EMAIL.test(normaliseForEmail(unwrapped))) return true

  const asDigits = collapseJoiners(
    unwrapped.replace(DIGIT_WORD_PATTERN, (word) => DIGIT_WORDS[word.toLowerCase()]),
  )

  // `PHONE_RUN` is global, so its lastIndex has to be reset between calls.
  PHONE_RUN.lastIndex = 0
  for (const match of asDigits.matchAll(PHONE_RUN)) {
    if (looksLikePhone(match[0])) return true
  }

  return false
}
