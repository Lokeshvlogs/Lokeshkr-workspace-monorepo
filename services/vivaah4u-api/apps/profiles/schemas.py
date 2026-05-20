# schemas.py
from ast import If
from ninja import Schema
from typing import Optional, Literal

from apps.profiles import models

class ProfileUpdateSchema(Schema):
    step: Literal[0, 1, 2, 3, 4]
    # Step 0: Basic Information
    firstName: Optional[str] = None
    surname: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    heightFeet: Optional[str] = None
    heightInches: Optional[str] = None
    bodyPhysique: Optional[str] = None
    maritalStatus: Optional[str] = None
    #manglikLevel: Optional[Literal["Manglik", "Partial Manglik", "Non-Manglik", "I don't know"]] = None
    manglikLevel: Optional[Literal[0, 1, 2, 3]] = None

    
    ## Step 1: Religious and Social Background
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
    livesWithFamily: Optional[bool] = None

    # Step 2: Education and Profession
    educationLevel: Optional[str] = None
    fieldOfStudy: Optional[str] = None
    collegeUniversity: Optional[str] = None
    profession: Optional[str] = None
    employedIn: Optional[str] = None
    employedAs: Optional[str] = None
    salaryAmount: Optional[str] = None

    # Step 3: Your lifestyle and preferences
    diet: Optional[str] = None
    smoking: Optional[str] = None
    drinking: Optional[str] = None
    routine: Optional[str] = None
    exercise: Optional[Literal[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]] = None
    religiousness: Optional[Literal[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]] = None
    astrologyBelief: Optional[Literal[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]] = None

    #If divorced or married before family details
    hasChildren: Optional[bool] = None
    wantsChildren: Optional[bool] = None
    
    photo: Optional[str] = None


class MyProfileOut(ProfileUpdateSchema):
    profile_id: str
    created_at: str
    updated_at: str
    profile_completeness: Optional[int] = None

class ProfileOut(ProfileUpdateSchema):
    profile_id: str
    created_at: str
    updated_at: str
    hide: Optional[bool] = None
    hide_profile_from_search: Optional[bool] = None
    hide_display_picture_from_search: Optional[bool] = None

