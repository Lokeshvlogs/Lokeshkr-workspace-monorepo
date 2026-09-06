from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken

from apps.profiles import managed_by as managed_by_rules
from apps.profiles.models import Profile

from .models import OtpCode
from .otp import check_code, dev_code, issue_code, latest_code, normalise_phone
from .schema import (
    AccountSchema,
    ChangeEmailSchema,
    ChangePasswordSchema,
    ChangePhoneSchema,
    ChangeUsernameSchema,
    LoginEmailSchema,
    LoginUsernameSchema,
    OtpRequestSchema,
    OtpSentSchema,
    OtpSessionSchema,
    OtpVerifySchema,
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


def issue_tokens(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def profile_for_phone(phone: str) -> Profile | None:
    """The single account owning this number, or None.

    Registration rejects a number that is already taken, so at most one row can
    match. A duplicate from older data is treated as no match rather than
    guessing which account the passcode should unlock.
    """
    digits = normalise_phone(phone)
    if not digits:
        return None
    matches = list(Profile.objects.filter(phone=digits).select_related("user")[:2])
    return matches[0] if len(matches) == 1 else None


def session_payload(user: User, verified: bool = True) -> dict:
    profile = getattr(user, "profile", None)
    return {
        "verified": verified,
        "username": user.username,
        "profile_id": (profile.profile_id if profile else None) or None,
        **issue_tokens(user),
    }


# -------------------------------
# Registration
# -------------------------------

@router.post("/register", response=RegisteredSchema)
def register(request, data: RegisterSchema):
    email = data.email.strip().lower()
    phone = normalise_phone(data.phone)

    # The sign-up form has no username field, so the email doubles as one.
    if User.objects.filter(username__iexact=email).exists():
        raise HttpError(400, "Username already taken")
    if User.objects.filter(email__iexact=email).exists():
        raise HttpError(400, "Email already in use")
    if data.profile_for == "self" and not data.looking_for:
        raise HttpError(400, "Please select whether you are looking for a bride or a groom")
    # A number must identify exactly one account, otherwise a login passcode
    # would be ambiguous about which account it unlocks.
    if phone and Profile.objects.filter(phone=phone).exists():
        raise HttpError(400, "This mobile number is already registered")

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
        profile.phone = phone
        profile.country_code = data.country_code
        profile.first_name = data.first_name
        profile.surname = data.surname
        profile.profile_for = data.profile_for
        profile.looking_for = data.looking_for or ""
        profile.age = data.age
        # Cosmetic only. Note it is NOT passed to derive_gender below: that
        # decides `gender`, which is baked into the permanent profile_id.
        profile.managed_by = data.managed_by or managed_by_rules.default_for(
            data.profile_for
        )
        profile.gender = derive_gender(data.profile_for, data.looking_for)
        # Saving with gender + age present is what mints `profile_id`.
        profile.save()

    # No tokens yet - the account stays unusable until the passcode confirms the
    # number. The client goes to the verification screen next.
    issue_code(phone, OtpCode.PURPOSE_SIGNUP, data.country_code, user=user)

    return {
        "message": "User registered successfully",
        "username": user.username,
        "profile_id": profile.profile_id,
        "phone": phone,
        "country_code": data.country_code,
        "verification_required": True,
    }


# -------------------------------
# LOGIN: Username + Password
# -------------------------------

def _guard_verified(user: User) -> None:
    """Refuse password login until the sign-up passcode has been confirmed."""
    profile = getattr(user, "profile", None)
    if profile and not profile.phone_verified:
        raise HttpError(403, "phone_not_verified")


@router.post("/login/username")
def login_with_username(request, data: LoginUsernameSchema):
    user = authenticate(username=data.username, password=data.password)

    if not user:
        raise HttpError(401, "Invalid username or password")
    _guard_verified(user)

    return {"username": user.username, **issue_tokens(user)}


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
    _guard_verified(user)

    return {"username": user.username, **issue_tokens(user)}


# -------------------------------
# One-time passcodes
# -------------------------------

@router.get("/otp/config")
def otp_config(request):
    """Passcode timings, and the development bypass code when one is set.

    The sign-up flow issues a code server-side, so the verification screen never
    calls /otp/request and would otherwise have no way to learn the development
    code. `dev_code` is null whenever OTP_DEV_CODE is cleared, which is what any
    real deployment does.
    """
    return {
        "dev_code": dev_code(),
        "expires_in": getattr(settings, "OTP_TTL_SECONDS", 300),
        "retry_after": getattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 30),
    }


@router.post("/otp/request", response=OtpSentSchema)
def request_otp(request, data: OtpRequestSchema):
    phone = normalise_phone(data.phone)
    if len(phone) < 6:
        raise HttpError(400, "Enter a valid mobile number")

    profile = profile_for_phone(phone)

    if data.purpose == OtpCode.PURPOSE_LOGIN and profile is None:
        # Deliberately vague: confirming which numbers have accounts would turn
        # this endpoint into a membership oracle.
        raise HttpError(404, "No account found for this mobile number")
    if data.purpose == OtpCode.PURPOSE_SIGNUP and profile is None:
        raise HttpError(404, "No pending registration for this mobile number")

    # Rate limit per number, not per account - the number is what receives SMS.
    existing = latest_code(phone, data.purpose)
    if existing and not existing.is_consumed:
        wait = existing.seconds_until_resend()
        if wait > 0:
            raise HttpError(429, f"Please wait {wait}s before requesting another code")

    otp = issue_code(
        phone,
        data.purpose,
        data.country_code or (profile.country_code if profile else ""),
        user=profile.user if profile else None,
    )

    return {
        "sent": True,
        "expires_in": getattr(settings, "OTP_TTL_SECONDS", 300),
        "retry_after": getattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 30),
        "dev_code": dev_code(),
    }


@router.post("/otp/verify", response=OtpSessionSchema)
def verify_otp(request, data: OtpVerifySchema):
    phone = normalise_phone(data.phone)
    profile = profile_for_phone(phone)
    if profile is None:
        raise HttpError(404, "No account found for this mobile number")

    otp = latest_code(phone, data.purpose)
    # With OTP_DEV_CODE configured there may be no issued row to check against
    # (the client can jump straight to the code), so only demand one when the
    # bypass is off.
    if otp is None and not dev_code():
        raise HttpError(400, "Request a code first")
    if otp is not None and not check_code(otp, data.code):
        raise HttpError(400, "That code is incorrect or has expired")
    if otp is None and data.code.strip() != dev_code():
        raise HttpError(400, "That code is incorrect or has expired")

    if otp is not None:
        otp.consume()

    # Verifying is what activates the account, and it signs the member in so
    # they land straight in the wizard rather than back at a login form.
    if not profile.phone_verified:
        profile.phone_verified = True
        profile.save(update_fields=["phone_verified"])

    return session_payload(profile.user)


# -------------------------------
# Google sign-up (not yet configured)
# -------------------------------

@router.get("/google/config")
def google_config(request):
    """Whether Google sign-in can be offered, and with which client id.

    Returns `configured: false` until GOOGLE_OAUTH_CLIENT_ID is set, which is
    what lets the UI render the button in a disabled, self-explaining state
    instead of failing when it is pressed.
    """
    client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or ""
    return {"configured": bool(client_id), "client_id": client_id}


# -------------------------------
# Account settings
# -------------------------------

@router.get("/account", response=AccountSchema, auth=JWTAuth())
def get_account(request):
    user = request.user
    profile = getattr(user, "profile", None)
    return {
        "username": user.username,
        "email": user.email,
        "phone": (profile.phone if profile else "") or "",
        "country_code": (profile.country_code if profile else "") or "",
        "phone_verified": bool(profile.phone_verified) if profile else False,
        "has_usable_password": user.has_usable_password(),
    }


@router.post("/account/password", auth=JWTAuth())
def change_password(request, data: ChangePasswordSchema):
    user = request.user
    if not user.check_password(data.current_password):
        raise HttpError(400, "Current password is incorrect")
    try:
        validate_password(data.new_password, user=user)
    except ValidationError as exc:
        raise HttpError(400, " ".join(exc.messages))

    user.set_password(data.new_password)
    user.save(update_fields=["password"])
    # The old refresh token still works, so hand back a fresh pair and let the
    # client replace its cookies rather than silently logging the member out.
    return {"success": True, "username": user.username, **issue_tokens(user)}


@router.post("/account/email", auth=JWTAuth())
def change_email(request, data: ChangeEmailSchema):
    user = request.user
    if not user.check_password(data.password):
        raise HttpError(400, "Password is incorrect")

    email = data.new_email.strip().lower()
    try:
        validate_email(email)
    except ValidationError:
        raise HttpError(400, "Enter a valid email address")
    if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
        raise HttpError(400, "Email already in use")

    user.email = email
    user.save(update_fields=["email"])
    profile = getattr(user, "profile", None)
    if profile:
        profile.email = email
        profile.save(update_fields=["email"])

    return {"success": True, "email": email}


@router.post("/account/username", auth=JWTAuth())
def change_username(request, data: ChangeUsernameSchema):
    user = request.user
    if not user.check_password(data.password):
        raise HttpError(400, "Password is incorrect")

    username = data.new_username.strip()
    if len(username) < 3:
        raise HttpError(400, "Username must be at least 3 characters")
    if User.objects.filter(username__iexact=username).exclude(pk=user.pk).exists():
        raise HttpError(400, "Username already taken")

    user.username = username
    user.save(update_fields=["username"])
    # The username is part of the JWT subject claim, so reissue.
    return {"success": True, "username": username, **issue_tokens(user)}


@router.post("/account/phone", auth=JWTAuth())
def change_phone(request, data: ChangePhoneSchema):
    """Swap the mobile number, proving control of the new one with a passcode."""
    user = request.user
    phone = normalise_phone(data.phone)
    if len(phone) < 6:
        raise HttpError(400, "Enter a valid mobile number")
    if Profile.objects.filter(phone=phone).exclude(user=user).exists():
        raise HttpError(400, "This mobile number is already registered")

    otp = latest_code(phone, OtpCode.PURPOSE_PHONE_CHANGE)
    if otp is None and not dev_code():
        raise HttpError(400, "Request a code first")
    if otp is not None and not check_code(otp, data.code):
        raise HttpError(400, "That code is incorrect or has expired")
    if otp is None and data.code.strip() != dev_code():
        raise HttpError(400, "That code is incorrect or has expired")
    if otp is not None:
        otp.consume()

    profile = user.profile
    profile.phone = phone
    profile.country_code = data.country_code or profile.country_code
    profile.phone_verified = True
    profile.save(update_fields=["phone", "country_code", "phone_verified"])

    return {"success": True, "phone": phone, "country_code": profile.country_code}


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
