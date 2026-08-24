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
  routine: string
  exercise: number
  religiousness: number
  astrologyBelief: number
  hasChildren: boolean
  wantsChildren: boolean
  photo: string | null
  /** Extra gallery photos, ordered. */
  photos: string[]
  profile_completeness: number
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
