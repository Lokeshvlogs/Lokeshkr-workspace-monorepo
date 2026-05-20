from typing import List
from django.shortcuts import get_object_or_404
from ninja import Router, File
from ninja.files import UploadedFile
from ninja.errors import HttpError
from .models import Profile
from .schemas import ProfileOut, MyProfileOut, ProfileUpdateSchema
from ninja_jwt.authentication import JWTAuth

router = Router(tags=['profiles'])
DEBUG = True

@router.get("/profiles", response=List[ProfileOut], auth=JWTAuth())
def profiles_list(request):
    qs = Profile.objects.all()
    return qs

@router.get("/me", response=MyProfileOut, auth=JWTAuth())
def my_profile(request):
    user = request.user
    try:
        profile = user.profile
    except Profile.DoesNotExist:
        raise HttpError(404, "Profile not found")

    # build display_picture URL if present
    dp = None
    if profile.display_picture:
        try:
            dp = request.build_absolute_uri(profile.display_picture.url)
        except Exception:
            dp = profile.display_picture.url

    # convert to dict matching ProfileOut
    return {
        'profile_id': str(profile.profile_id),
        'firstName': profile.first_name,
        'surname': profile.surname,
        'dob': profile.dob.isoformat() if profile.dob else None,
        'gender': profile.gender,
        'heightFeet': profile.height_feet,
        'heightInches': profile.height_inches,
        'bodyPhysique': profile.body_physique,
        'maritalStatus': profile.marital_status,
        'manglikLevel': profile.manglik_level,
        'religion': profile.religion,
        'community': profile.community,
        'motherTongue': profile.mother_tongue,
        'currentCountry': profile.current_country,
        'currentCity': profile.current_city,
        'placeOfBirthCountry': profile.place_of_birth_country,
        'placeOfBirthCity': profile.place_of_birth_city,
        'familyLivingInCountry': profile.family_living_in_country,
        'familyLivingInCity': profile.family_living_in_city,
        'familyIncome': profile.family_income,
        'livesWithFamily': profile.lives_with_family,
        'educationLevel': profile.education_level,
        'fieldOfStudy': profile.field_of_study,
        'collegeUniversity': profile.college_university,
        'profession': profile.profession,
        'employedIn': profile.employed_in,
        'employedAs': profile.employed_as,
        'salaryAmount': profile.annual_income,
        'diet': profile.diet,
        'smoking': profile.smoking_habits,
        'drinking': profile.drinking_habits,
        'routine': profile.daily_routine,
        'exercise': profile.exercise_habits,
        'religiousness': profile.religiousness,
        'astrologyBelief': profile.astrology_belief,
        
        'display_picture': dp,
        'created_at': profile.created_at.isoformat(),
        'updated_at': profile.updated_at.isoformat(),
        'profile_completeness': profile.profile_completeness,
    }



@router.patch("/save-step", auth=JWTAuth())
def update_profile_step(request, data: ProfileUpdateSchema):

    step = data.step
    data.pop("step")
    data = data.dict(exclude_unset=True)
    if DEBUG:
        print("DEBUG: Registration data received: ", data.items())
    profile = get_object_or_404(Profile, user=request.user)
    # STEP-BASED VALIDATION
    if step not in [0, 1, 2, 3]:
        raise HttpError(400, "Invalid step value")

    # PARTIAL UPDATE (🔥 IMPORTANT)
    for field, value in data.items():
        if value is not None:
            setattr(profile, field, value)

    profile.save()

    return {"success": True, "step": step}

@router.post("/me/photo", auth=JWTAuth())
def upload_profile_photo(request, file: UploadedFile = File(...)):
    """Upload or replace the authenticated user's profile photo.

    Validates image content type and size (max 5MB), saves to `display_picture`.
    """
    user = request.user
    try:
        profile = user.profile
    except Profile.DoesNotExist:
        raise HttpError(404, "Profile not found")

    # Basic validations
    content_type = getattr(file, 'content_type', '')
    if not content_type or not content_type.startswith('image/'):
        raise HttpError(400, "Uploaded file must be an image")

    max_size = 5 * 1024 * 1024  # 5 MB
    if file.size > max_size:
        raise HttpError(400, "Image size must be <= 5MB")

    # Save file to ImageField
    # Use original filename; Django will handle name collisions
    profile.display_picture.save(file.name, file, save=True)

    # return updated profile data (only photo url)
    try:
        photo_url = request.build_absolute_uri(profile.display_picture.url)
    except Exception:
        photo_url = profile.display_picture.url

    return {"display_picture": photo_url}