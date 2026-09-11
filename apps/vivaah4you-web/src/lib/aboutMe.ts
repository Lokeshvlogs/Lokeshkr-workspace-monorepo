import { labelFor, locationLabel } from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

/**
 * A first draft of a bio, built from what the wizard already collected.
 *
 * The About-me box left step 1 because it is the one question nobody can answer
 * in the middle of filling in twenty others - members either skipped it or
 * wrote a line they never came back to. It is offered here instead, after the
 * profile exists, as a *suggestion*: nothing is written until the member reads
 * it and presses Save, so no one publishes generated text unknowingly.
 *
 * Written entirely on the client from fields already on the page - there is no
 * model call behind this, and no request leaves the browser.
 */

/**
 * A stable number from the profile id.
 *
 * Members with near-identical answers should not all get the same sentences,
 * and re-opening the page should not shuffle the wording underneath somebody
 * who is still reading it - so the variation is keyed to the profile rather
 * than to chance.
 */
function seedOf(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return hash
}

const pick = <T,>(options: T[], seed: number, salt: number): T =>
  options[(seed + salt) % options.length]

/**
 * A list label, recased to sit inside a sentence.
 *
 * Option labels are Title Case because they head a dropdown: "Software
 * Engineer" mid-sentence looks like a job advert. Words that are already all
 * capitals are left alone - "IT Support" has to become "IT support", not "it
 * support".
 */
const soften = (label: string): string =>
  label
    .split(' ')
    .map((word) => (word === word.toUpperCase() ? word : word.toLowerCase()))
    .join(' ')

/** "a, b and c" - the Oxford-free join that reads as a sentence. */
function listOf(values: string[], key: string, limit: number): string {
  const labels = values
    .slice(0, limit)
    .map((value) => soften(labelFor(key, value)))
    .filter(Boolean)

  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

/**
 * Openers, with a set per gender.
 *
 * The two sets differ in phrasing only. Nothing here assumes anything about
 * what someone is like from their gender - the split exists so that two
 * profiles with otherwise identical answers do not open with the same line,
 * which is the whole risk of a generated bio.
 */
const OPENERS_MALE = [
  'I am {who}, and the sort of person who',
  'I am {who} — and, more to the point, someone who',
  "I'm {who}, and away from work I'm the one who",
]

const OPENERS_FEMALE = [
  "I'm {who}, and by nature someone who",
  'I am {who} — though what I would rather be known for is that I am someone who',
  'I am {who}. Outside of that, I am the sort who',
]

const CLOSERS = [
  'I would like to meet someone easy to talk to, and to take it from there.',
  'What I am hoping for is a partner I can be myself around, and a family we build together.',
  'Looking for someone kind and straightforward — the rest, I think, works itself out.',
]

/**
 * The suggested bio. `''` when there is too little to work from - a bio of
 * pure filler is worse than an empty one, and the prompt to write your own
 * still stands.
 */
export function suggestAboutMe(profile: PublicProfile): string {
  const seed = seedOf(profile.profile_id || profile.firstName || 'x')

  const age = profile.age ? `${profile.age}-year-old` : ''
  const profession = profile.profession ? soften(labelFor('profession', profile.profession)) : ''
  const place = locationLabel(profile)
  const education = profile.educationLevel ? soften(labelFor('educationLevel', profile.educationLevel)) : ''
  const diet = profile.diet ? soften(labelFor('diet', profile.diet)) : ''

  const hobbies = listOf(profile.interestsHobbies ?? [], 'interestsHobbies', 3)
  const travel = listOf(profile.interestsTravel ?? [], 'interestsTravel', 2)
  const food = listOf(profile.interestsCuisines ?? [], 'interestsCuisines', 2)
  const music = listOf(profile.interestsMusic ?? [], 'interestsMusic', 2)

  // Nothing but an age is not a bio. Two real facts is the floor.
  const facts = [profession, place, education, hobbies, travel, food, music].filter(Boolean)
  if (facts.length < 2) return ''

  const openers = profile.gender === 'female' ? OPENERS_FEMALE : OPENERS_MALE

  /* Built as one phrase rather than two slots, so a missing age or a missing
     profession does not leave "a 29-year-old" dangling or, worse, "a " on its
     own. With neither, the opener falls back to a bare "someone". */
  const descriptor = [age, profession].filter(Boolean).join(' ')
  const who = descriptor ? `a ${descriptor}` : 'someone'

  const sentences: string[] = []

  const opener = pick(openers, seed, 0).replace('{who}', who)

  if (hobbies) {
    sentences.push(`${opener} is happiest around ${hobbies}.`)
  } else if (travel) {
    sentences.push(`${opener} plans the next trip before the current one ends — ${travel}, mostly.`)
  } else {
    sentences.push(`${opener} keeps life fairly simple.`)
  }

  if (place) {
    sentences.push(
      education
        ? `I live in ${place}, and studied up to ${education}.`
        : `I live in ${place}.`,
    )
  } else if (education) {
    sentences.push(`I studied up to ${education}.`)
  }

  if (food || diet) {
    sentences.push(
      food && diet
        ? `${diet.charAt(0).toUpperCase() + diet.slice(1)}, and a soft spot for ${food}.`
        : food
          ? `A soft spot for ${food}.`
          : `${diet.charAt(0).toUpperCase() + diet.slice(1)}, by the way.`,
    )
  }

  if (music && hobbies) sentences.push(`Most evenings there is ${music} playing somewhere.`)
  if (travel && hobbies) sentences.push(`Given a free weekend, it is usually ${travel}.`)

  sentences.push(pick(CLOSERS, seed, 1))

  return sentences.join(' ')
}

/** Why filling this in is worth the two minutes - shown beside the suggestion. */
export const BIO_ADVANTAGE =
  'Profiles with a few lines here get noticeably more interest — it is the part people read before deciding whether to write.'
