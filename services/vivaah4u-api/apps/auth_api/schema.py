from typing import Literal

from ninja import NinjaAPI, Schema

# -------------------------------
# Schemas
# -------------------------------

class RegisterSchema(Schema):
    email: str
    first_name: str
    surname: str
    profile_for: Literal[0, 1, 2, 3, 4]  # 0: Son, 1: Daughter, 2: Brother, 3: Sister, 4: Self
    age: int
    looking_for: Literal[0, 1]  # 0: Bride, 1: Groom
    country_code: str
    phone: str
    password: str

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