# schemas.py
from typing import Optional, Union

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

    # Step 3 - lifestyle and preferences
    diet: Optional[str] = None
    smoking: Optional[str] = None
    drinking: Optional[str] = None
    routine: Optional[str] = None
    exercise: Optional[Number] = None
    religiousness: Optional[Number] = None
    astrologyBelief: Optional[Number] = None
    hasChildren: Optional[bool] = None
    wantsChildren: Optional[bool] = None

    # Step 4 - photo, sent as a base64 data URL
    photo: Optional[str] = None
