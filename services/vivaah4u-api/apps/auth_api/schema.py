from typing import Literal, Optional

from ninja import Schema

# -------------------------------
# Schemas
# -------------------------------

# String values here mirror PROFILE_FOR_VALUES / LOOKING_FOR_VALUES in
# apps/vivaah4you-web/src/app/Register/constants/RegisterUserOptions.ts.
ProfileFor = Literal["son", "daughter", "brother", "sister", "self"]
LookingFor = Literal["bride", "groom"]
# Who answers the messages. Pre-filled from profile_for on the form, and
# deliberately never used to derive gender - see apps.profiles.managed_by.
ManagedBy = Literal["self", "parent", "sibling", "relative", "guardian", "friend"]


class RegisterSchema(Schema):
    email: str
    first_name: str
    surname: str
    profile_for: ProfileFor
    age: int
    # Only collected when profile_for == "self"; the sign-up form hides it otherwise.
    looking_for: Optional[LookingFor] = None
    # Optional: defaults from profile_for when the form does not send it.
    managed_by: Optional[ManagedBy] = None
    country_code: str
    phone: str
    password: str


class RegisteredSchema(Schema):
    message: str
    username: str
    profile_id: Optional[str] = None
    # Echoed back so the client can go straight to the passcode screen without
    # re-reading the form it just submitted.
    phone: str = ""
    country_code: str = ""
    verification_required: bool = True


class LoginUsernameSchema(Schema):
    username: str
    password: str


class LoginEmailSchema(Schema):
    email: str
    password: str


class MessageSchema(Schema):
    message: str


class RefreshSchema(Schema):
    refresh: str


# -------------------------------
# One-time passcodes
# -------------------------------

# Kept in step with OtpCode.PURPOSE_CHOICES.
OtpPurpose = Literal["signup", "login", "phone_change"]


class OtpRequestSchema(Schema):
    phone: str
    country_code: str = ""
    purpose: OtpPurpose = "signup"


class OtpSentSchema(Schema):
    sent: bool
    expires_in: int
    retry_after: int
    # Only populated while OTP_DEV_CODE is configured, so the flow is testable
    # without an SMS provider. Never set in production.
    dev_code: Optional[str] = None


class OtpVerifySchema(Schema):
    phone: str
    code: str
    country_code: str = ""
    purpose: OtpPurpose = "signup"


class OtpSessionSchema(Schema):
    """Verification result. Doubles as a login response - verifying signs you in."""
    verified: bool
    username: str
    access: str
    refresh: str
    profile_id: Optional[str] = None


# -------------------------------
# Account settings
# -------------------------------

class AccountSchema(Schema):
    username: str
    email: str
    phone: str = ""
    country_code: str = ""
    phone_verified: bool = False
    has_usable_password: bool = True


class ChangePasswordSchema(Schema):
    current_password: str
    new_password: str


class ChangeEmailSchema(Schema):
    password: str
    new_email: str


class ChangeUsernameSchema(Schema):
    password: str
    new_username: str


class ChangePhoneSchema(Schema):
    phone: str
    code: str
    country_code: str = ""
