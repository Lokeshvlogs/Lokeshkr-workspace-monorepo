from typing import Literal, Optional

from ninja import Schema

# -------------------------------
# Schemas
# -------------------------------

# String values here mirror PROFILE_FOR_VALUES / LOOKING_FOR_VALUES in
# apps/vivaah4you-web/src/app/Register/constants/RegisterUserOptions.ts.
ProfileFor = Literal["son", "daughter", "brother", "sister", "self"]
LookingFor = Literal["bride", "groom"]


class RegisterSchema(Schema):
    email: str
    first_name: str
    surname: str
    profile_for: ProfileFor
    age: int
    # Only collected when profile_for == "self"; the sign-up form hides it otherwise.
    looking_for: Optional[LookingFor] = None
    country_code: str
    phone: str
    password: str


class RegisteredSchema(Schema):
    message: str
    username: str
    profile_id: Optional[str] = None


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
