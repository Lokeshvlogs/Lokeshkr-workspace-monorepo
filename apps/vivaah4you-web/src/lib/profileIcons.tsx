import type { ComponentType } from 'react'
import {
  Activity,
  Baby,
  BadgeCheck,
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Cake,
  CalendarDays,
  Cigarette,
  Dumbbell,
  Film,
  Flame,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Home,
  Landmark,
  Languages,
  MapPin,
  Music,
  Palette,
  PersonStanding,
  Plane,
  Ruler,
  School,
  Sparkles,
  Users,
  Users2,
  Utensils,
  Wallet,
  Wine,
} from 'lucide-react'

export type FieldIcon = ComponentType<{
  className?: string
  strokeWidth?: number
  'aria-hidden'?: boolean | 'true' | 'false'
}>

/**
 * Icon per profile field, keyed by the same `key` as PROFILE_FIELDS.
 *
 * Kept out of profileFields.ts deliberately. That module is pure data in a .ts
 * file; putting components in it would force a .tsx rename and pull React into
 * every consumer. Icons are also many-to-one (three different city fields all
 * want a pin) and deliberately partial - a Record with a fallback says that,
 * where fifty `icon:` keys with fifteen holes would not.
 *
 * Absent on purpose:
 *  - livesWithFamily, hasChildren - the value is already a plain word ("Yes");
 *    an icon beside it is a riddle, not a shortcut. `gender` was here too, but
 *    it now leads a row in the hero facts grid where every other row has a
 *    glyph, and the odd one out read as a rendering fault.
 *  - aboutMe, familyAbout, partnerAbout - free text needs a real heading.
 *  - religiosityDetail ("More specifically") - no glyph carries that meaning.
 * Anything not listed here falls back to its visible text label.
 */
export const FIELD_ICONS: Record<string, FieldIcon> = {
  // Basic details
  dob: CalendarDays,
  age: Cake,
  height: Ruler,
  gender: PersonStanding,
  bodyPhysique: Dumbbell,
  maritalStatus: HeartHandshake,
  manglikLevel: Sparkles,

  // Religion & community. Landmark, not Church: this is a multi-faith product
  // and a steeple is the wrong glyph for most members on it.
  religion: Landmark,
  community: Users,
  mothertongue: Languages,
  religiosity: Flame,

  // Location
  currentCountry: Globe2,
  currentCity: MapPin,
  placeOfBirthCountry: Globe2,
  placeOfBirthCity: Baby,
  citizenshipCountry: BadgeCheck,

  // Education & career
  educationLevel: GraduationCap,
  fieldOfStudy: BookOpen,
  collegeUniversity: School,
  profession: Briefcase,
  employedIn: Building2,
  employedAs: Briefcase,
  salaryAmount: Banknote,

  // Family
  familyLivingInCountry: Globe2,
  familyLivingInCity: Home,
  familyType: Users2,
  familyIncome: Wallet,

  // Lifestyle
  diet: Utensils,
  smoking: Cigarette,
  drinking: Wine,
  dailyRoutine: Activity,

  // Interests
  interestsMusic: Music,
  interestsMovies: Film,
  interestsBooks: BookOpen,
  interestsCuisines: Utensils,
  interestsTravel: Plane,
  interestsHobbies: Palette,
  // interestsOther is free text under its own heading - no icon.

  employerName: Building2,
  workCountry: Globe2,
  visaStatus: Landmark,

  // Career extras
  settleAbroad: Plane,
  partnerSettleAbroad: Plane,
  partnerRelocateAfterMarriage: Home,

  // Partner preference reuses the icon of the field it constrains.
  partnerAgeMin: Cake,
  partnerAgeMax: Cake,
  partnerHeightMin: Ruler,
  partnerHeightMax: Ruler,
  /* Plural, matching the multi-select field keys in profileFields.ts. These
     were registered in the singular, so `iconFor` missed on all eight and the
     whole Partner Preference section rendered as text-label rows beside its
     icon-led neighbours. */
  partnerMaritalStatuses: HeartHandshake,
  partnerReligions: Landmark,
  partnerCommunities: Users,
  partnerMotherTongues: Languages,
  partnerCountries: Globe2,
  partnerEducations: GraduationCap,
  partnerProfessions: Briefcase,
  partnerDiets: Utensils,
  partnerReligiosities: Sparkles,
  partnerSmoking: Cigarette,
  partnerDrinking: Wine,
}

/** The icon for a field, or null when it should keep its text label. */
export function iconFor(key: string): FieldIcon | null {
  return FIELD_ICONS[key] ?? null
}

/**
 * One glyph per section heading.
 *
 * `.form-section-title` has always been a flex row with a gap, and
 * `.form-section-icon` has always existed - the wizard uses both. The profile's
 * own sections simply never passed an icon, so they read as plain text
 * headings beside the wizard's illustrated ones.
 */
export const SECTION_ICONS: Record<string, FieldIcon | undefined> = {
  'Religion & Community': Landmark,
  Location: MapPin,
  'Education & Career': GraduationCap,
  Family: Users2,
  Lifestyle: Utensils,
  Interests: Sparkles,
  'Partner Preference': HeartHandshake,
}
