from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.db import transaction
from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken

from .schema import (
    LoginEmailSchema,
    LoginUsernameSchema,
    RefreshSchema,
    RegisterSchema,
    RegisteredSchema,
)

router = Router(tags=["auth_api"])

# Whose profile is being created -> that person's gender.
GENDER_BY_PROFILE_FOR = {
    "son": "M",
    "brother": "M",
    "daughter": "F",
    "sister": "F",
}
# When the profile is the user's own, gender is the inverse of who they seek.
GENDER_BY_LOOKING_FOR = {
    "bride": "M",
    "groom": "F",
}


def derive_gender(profile_for: str, looking_for: str | None) -> str:
    if profile_for == "self":
        return GENDER_BY_LOOKING_FOR.get(looking_for or "", "O")
    return GENDER_BY_PROFILE_FOR.get(profile_for, "O")


# -------------------------------
# Registration
# -------------------------------

@router.post("/register", response=RegisteredSchema)
def register(request, data: RegisterSchema):
    email = data.email.strip().lower()

    # The sign-up form has no username field, so the email doubles as one.
    if User.objects.filter(username__iexact=email).exists():
        raise HttpError(400, "Username already taken")
    if User.objects.filter(email__iexact=email).exists():
        raise HttpError(400, "Email already in use")
    if data.profile_for == "self" and not data.looking_for:
        raise HttpError(400, "Please select whether you are looking for a bride or a groom")

    with transaction.atomic():
        user = User.objects.create(
            username=email,
            email=email,
            first_name=data.first_name,
            last_name=data.surname,
            password=make_password(data.password),
        )

        # Created by the post_save signal in apps.profiles.signals.
        profile = user.profile
        profile.email = email
        profile.phone = data.phone
        profile.country_code = data.country_code
        profile.first_name = data.first_name
        profile.surname = data.surname
        profile.profile_for = data.profile_for
        profile.looking_for = data.looking_for or ""
        profile.age = data.age
        profile.gender = derive_gender(data.profile_for, data.looking_for)
        # Saving with gender + age present is what mints `profile_id`.
        profile.save()

    return {
        "message": "User registered successfully",
        "username": user.username,
        "profile_id": profile.profile_id,
    }


# -------------------------------
# LOGIN: Username + Password
# -------------------------------

@router.post("/login/username")
def login_with_username(request, data: LoginUsernameSchema):
    user = authenticate(username=data.username, password=data.password)

    if not user:
        raise HttpError(401, "Invalid username or password")

    refresh = RefreshToken.for_user(user)
    return {
        "username": user.username,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


# -------------------------------
# LOGIN: Email + Password
# -------------------------------

@router.post("/login/email")
def login_with_email(request, data: LoginEmailSchema):
    try:
        user = User.objects.get(email__iexact=data.email.strip())
    except User.DoesNotExist:
        raise HttpError(401, "Invalid email or password")

    # Authenticate using username internally
    user = authenticate(username=user.username, password=data.password)
    if not user:
        raise HttpError(401, "Invalid email or password")

    refresh = RefreshToken.for_user(user)
    return {
        "username": user.username,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


# -------------------------------
# Token refresh
# -------------------------------

@router.post("/token/refresh")
def refresh_token(request, data: RefreshSchema):
    try:
        refresh = RefreshToken(data.refresh)
        return {"access": str(refresh.access_token)}
    except Exception:
        raise HttpError(401, "Invalid refresh token")


# -------------------------------
# Simple hello Test auth_api reachability
# -------------------------------
@router.get("/hello")
def hello(request):
    return {"message": "Hello from auth_api!"}


# -------------------------------
# Protected Route
# -------------------------------

@router.get("/protected", auth=JWTAuth())
def protected(request):
    return {"message": "Authenticated!", "user_id": request.user.id}
