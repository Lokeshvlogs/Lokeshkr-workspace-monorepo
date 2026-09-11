import type { PresenceBlock } from '@/lib/presence'

/** One qualification. See services/vivaah4u-api/apps/profiles/models.py. */
export interface ProfileEducationEntry {
  level: string
  fieldOfStudy: string
  country: string
  /** Catalog slug when picked from the list; blank for "Other / not listed". */
  institutionSlug: string
  institutionName: string
  isOther: boolean
  reputationClaimed: boolean
  completionYear: number | null
}

export interface ProfileAchievement {
  title: string
  year: number | null
  detail: string
}

/**
 * One named pick under Music, Films or Reading.
 *
 * `title` is the only field that is always present. Everything else is what the
 * unfurl found, and a member who typed a name without pasting a link has a
 * perfectly complete pick with four empty strings. The server drops `url` and
 * `thumbnail` whose hosts it does not recognise, so neither can be trusted to
 * be present just because `provider` is.
 */
export interface MediaPick {
  title: string
  /** Artist, author, year - whatever the provider offered as a second line. */
  subtitle: string
  url: string
  /** A provider slug from `config/linkPreview`, or "" for a typed title. */
  provider: string
  thumbnail: string
}

/** Profile shape returned by the Django API (see apps/profiles/mapping.py). */
export interface PublicProfile {
  profile_id: string
  firstName: string
  surname: string
  gender: 'male' | 'female' | 'other'
  age: number | null
  heightFeet: number
  heightInches: number
  bodyPhysique: string
  maritalStatus: string
  manglikLevel: number
  religion: string
  community: string
  mothertongue: string
  currentCountry: string
  currentCity: string
  placeOfBirthCountry: string
  placeOfBirthCity: string
  citizenshipCountry: string
  familyLivingInCountry: string
  familyLivingInCity: string
  familyIncome: string
  familyType: number
  livesWithFamily: boolean
  educationLevel: string
  fieldOfStudy: string
  collegeUniversity: string
  profession: string
  employedIn: string
  employedAs: string
  salaryAmount: string
  diet: string
  smoking: string
  drinking: string
  hasChildren: boolean
  aboutMe: string
  religiosity: string
  religiosityDetail: string
  fatherOccupation: string
  motherOccupation: string
  brothers: number
  brothersMarried: number
  sisters: number
  sistersMarried: number
  familyAbout: string
  partnerAgeMin: number | null
  partnerAgeMax: number | null
  partnerHeightMin: number | null
  partnerHeightMax: number | null
  partnerMaritalStatus: string
  partnerReligion: string
  partnerCommunity: string
  partnerMotherTongue: string
  partnerCountry: string
  partnerEducation: string
  partnerProfession: string
  partnerDiet: string
  partnerAbout: string

  /** Interests, as option slugs. See constants/selectOptions/interests.ts. */
  /**
   * Named picks: a song, film or book the member chose, with the artwork
   * unfurled from the link they pasted.
   *
   * Genre tags before this, which said almost nothing - half of any Indian
   * matrimonial site likes Bollywood, and "Bollywood" beside "Bollywood" is not
   * a conversation. Food, travel and hobbies are still slug lists.
   */
  interestsMusic: MediaPick[]
  interestsMovies: MediaPick[]
  interestsBooks: MediaPick[]
  interestsCuisines: string[]
  interestsTravel: string[]
  interestsHobbies: string[]
  /** The one free-text field; unscored, so nobody writes filler for a number. */
  interestsOther: string
  dailyRoutine: string

  /**
   * Employer. `employerSlug` is a catalog slug when picked from the list;
   * blank for a free-text employer. The internal reputation tier behind it
   * never leaves the server.
   */
  employerSlug: string
  employerName: string
  /** ISO-2 country of work, which is what makes visaStatus answerable. */
  workCountry: string
  /** A value from the catalog's visa list for `workCountry`. */
  visaStatus: string

  /**
   * Who runs this profile. Derived server-side from `managed_by`, falling
   * back to what `profileFor` implies - the raw `profileFor` stays
   * owner-only, since "son" would leak gender a second time.
   */
  managedBy: string
  /** Ready-to-render phrasing; first person on your own profile. */
  managedByLabel: string

  /** Your own answer. "" unanswered, else yes | open | no. */
  settleAbroad: string
  /**
   * Mobility answers you would accept in a partner. Lists, because several
   * answers are usually equally acceptable; every selected value is matched
   * against. Empty means no preference.
   */
  partnerRelocateAfterMarriage: string[]
  partnerSettleAbroad: string[]

  /**
   * Lifestyle and outlook you would accept in a partner. Same list semantics
   * as the mobility answers above: OR within a field, empty is no preference.
   *
   * These replaced the two After-marriage questions in the wizard. Those two
   * columns stay in `PublicProfile` because profiles saved before the change
   * still carry values and the profile view still shows them - nothing writes
   * them any more.
   */
  partnerReligiosities: string[]
  partnerSmoking: string[]
  partnerDrinking: string[]

  /**
   * Education history, most-preferred order first. `educationLevel`,
   * `fieldOfStudy` and `collegeUniversity` above are DERIVED from the highest
   * of these by the server - read them, never write them.
   *
   * Institution reputation is deliberately absent; it never leaves the server.
   */
  educations: ProfileEducationEntry[]
  achievements: ProfileAchievement[]

  /**
   * Multi-value partner preferences. These supersede the singular fields
   * above, which remain on the payload for one release so an older client
   * keeps working. An empty array means "no preference".
   */
  partnerMaritalStatuses: string[]
  partnerReligions: string[]
  partnerCommunities: string[]
  partnerMotherTongues: string[]
  partnerCountries: string[]
  partnerEducations: string[]
  partnerProfessions: string[]
  partnerDiets: string[]
  photo: string | null
  /** Extra gallery photos, ordered. */
  photos: string[]
  profile_completeness: number
  /**
   * How much is actually known about who this member is - see
   * apps/profiles/verification.py. Only the derived level crosses the wire;
   * the evidence behind it stays server-side.
   */
  verification_level: VerificationLevel
  /**
   * Absent for anonymous readers - the API only tells a signed-in viewer when
   * somebody was last around. Null when the member has never been stamped.
   */
  presence?: PresenceBlock | null
}

/** Mirrors VerificationLevel in services/vivaah4u-api/apps/profiles/verification.py. */
export enum VerificationLevel {
  None = 0,
  /** Sign-up passcode confirmed. */
  Basic = 1,
  /** Everything answered, on a confirmed number. Diligence, not identity. */
  Complete = 2,
  /** A document check passed. Not reachable yet. */
  IdVerified = 3,
}

/** Adds the owner-only fields returned by /api/profile/me. */
export interface MyProfile extends PublicProfile {
  email: string
  phone: string
  countryCode: string
  profileFor: string
  lookingFor: string
  dob: string | null
  created_at: string
  updated_at: string
  is_complete: boolean
}
