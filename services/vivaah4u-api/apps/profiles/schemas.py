# schemas.py
from typing import List, Optional, Union

from ninja import Schema

# The wizard sends dropdown values as strings and slider values as numbers, so
# the numeric fields accept both and are normalised in apps.profiles.mapping.
Number = Union[int, str]


class ProfileUpdateSchema(Schema):
    """One step of the profile-registration wizard.

    Every field is optional: each step PATCHes only the keys it owns, and
    `exclude_unset` keeps untouched columns untouched.
    """

    step: int

    # Step 0 - basic details
    firstName: Optional[str] = None
    surname: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    heightFeet: Optional[Number] = None
    heightInches: Optional[Number] = None
    bodyPhysique: Optional[str] = None
    maritalStatus: Optional[str] = None
    manglikLevel: Optional[Number] = None

    # Step 1 - religious and social background
    religion: Optional[str] = None
    community: Optional[str] = None
    mothertongue: Optional[str] = None
    currentCountry: Optional[str] = None
    currentCity: Optional[str] = None
    placeOfBirthCountry: Optional[str] = None
    placeOfBirthCity: Optional[str] = None
    citizenshipCountry: Optional[str] = None
    familyLivingInCountry: Optional[str] = None
    familyLivingInCity: Optional[str] = None
    familyIncome: Optional[str] = None
    familyType: Optional[Number] = None
    livesWithFamily: Optional[bool] = None

    # Step 2 - education and profession
    educationLevel: Optional[str] = None
    fieldOfStudy: Optional[str] = None
    collegeUniversity: Optional[str] = None
    profession: Optional[str] = None
    employedIn: Optional[str] = None
    employedAs: Optional[str] = None
    salaryAmount: Optional[str] = None

    # About the member (optional)
    aboutMe: Optional[str] = None

    # Religious outlook: broad stance plus qualifier
    religiosity: Optional[str] = None
    religiosityDetail: Optional[str] = None

    # Family background (all optional)
    fatherOccupation: Optional[str] = None
    motherOccupation: Optional[str] = None
    brothers: Optional[Number] = None
    brothersMarried: Optional[Number] = None
    sisters: Optional[Number] = None
    sistersMarried: Optional[Number] = None
    familyAbout: Optional[str] = None

    # Partner preference
    partnerAgeMin: Optional[Number] = None
    partnerAgeMax: Optional[Number] = None
    partnerHeightMin: Optional[Number] = None
    partnerHeightMax: Optional[Number] = None
    partnerMaritalStatus: Optional[str] = None
    partnerReligion: Optional[str] = None
    partnerCommunity: Optional[str] = None
    partnerMotherTongue: Optional[str] = None
    partnerCountry: Optional[str] = None
    partnerEducation: Optional[str] = None
    partnerProfession: Optional[str] = None
    partnerDiet: Optional[str] = None
    partnerAbout: Optional[str] = None

    # Multi-value partner preferences. An empty list is a real answer ("no
    # preference"), which is why these are distinct from the singular keys
    # above rather than replacing them in place.
    partnerMaritalStatuses: Optional[List[str]] = None
    partnerReligions: Optional[List[str]] = None
    partnerCommunities: Optional[List[str]] = None
    partnerMotherTongues: Optional[List[str]] = None
    partnerCountries: Optional[List[str]] = None
    partnerEducations: Optional[List[str]] = None
    partnerProfessions: Optional[List[str]] = None
    partnerDiets: Optional[List[str]] = None

    interestsMusic: Optional[List[str]] = None
    interestsMovies: Optional[List[str]] = None
    interestsBooks: Optional[List[str]] = None
    interestsCuisines: Optional[List[str]] = None
    interestsTravel: Optional[List[str]] = None
    interestsHobbies: Optional[List[str]] = None
    interestsOther: Optional[str] = None
    dailyRoutine: Optional[str] = None

    employerSlug: Optional[str] = None
    employerName: Optional[str] = None
    workCountry: Optional[str] = None
    visaStatus: Optional[str] = None

    managedBy: Optional[str] = None
    settleAbroad: Optional[str] = None
    # Lists: a member may accept several answers, and every one selected is
    # matched against. Empty means no preference.
    partnerRelocateAfterMarriage: Optional[List[str]] = None
    partnerSettleAbroad: Optional[List[str]] = None
    partnerReligiosities: Optional[List[str]] = None
    partnerSmoking: Optional[List[str]] = None
    partnerDrinking: Optional[List[str]] = None

    # The complete desired education history - omitting a row deletes it, the
    # same contract `photos` uses. Entries are validated in mapping.py rather
    # than here so the institution slug can be resolved against the catalog in
    # the same pass.
    educations: Optional[List[dict]] = None
    achievements: Optional[List[dict]] = None

    # Step 3 - lifestyle and preferences
    diet: Optional[str] = None
    smoking: Optional[str] = None
    drinking: Optional[str] = None
    hasChildren: Optional[bool] = None

    # Step 4 - photos, sent as base64 data URLs (or the URLs of ones already
    # stored, which are kept as-is). The list is the complete desired gallery.
    photo: Optional[str] = None
    photos: Optional[List[str]] = None
