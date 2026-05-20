from ninja import Router
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as django_login
from django.contrib.auth.hashers import make_password
from .schema import RegisterSchema, LoginUsernameSchema, LoginEmailSchema, MessageSchema
from ninja.errors import HttpError

from ninja_jwt.tokens import RefreshToken
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.controller import NinjaJWTDefaultController

router = Router(tags=["auth_api"])

DEBUG = True

# -------------------------------
# Registration
# -------------------------------

@router.post("/register", response= MessageSchema)
def register(request, data: RegisterSchema):
    if DEBUG:
        print("DEBUG: Registration data received: ", data.dict())
    if User.objects.filter(username=data.username).exists():
        return HttpError(400, "Username already taken")
    if User.objects.filter(email=data.email).exists():
        return HttpError(400, "Email already in use")

    user = User.objects.create(
        username=data.username,
        email=data.email,
        password=make_password(data.password),
    )
    if DEBUG:
        print("DEBUG: user created: ", user.username)

    if data.phone:
        user.profile.phone = data.phone
        user.profile.save()

    return {"message": "User registered successfully"}


# -------------------------------
# LOGIN: Username + Password
# -------------------------------

@router.post("/login/username")
def login_with_username(request, data: LoginUsernameSchema):
    if DEBUG:
        print("DEBUG: Login data recieved: ", data.dict())
    user = authenticate(username=data.username, password=data.password)

    if not user:
        print("Authentication failed.")
        return 401, {"detail": "Invalid username or password"}

    print("Authentication successful.") 
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


# -------------------------------
# LOGIN: Email + Password
# -------------------------------

@router.post("/login/email")
def login_with_email(request, data: LoginEmailSchema):

    try:
        user = User.objects.get(email=data.email)
    except User.DoesNotExist:
        return 401, {"detail": "Invalid email or password"}

    # Authenticate using username internally
    user = authenticate(username=user.username, password=data.password)
    if not user:
        return 401, {"detail": "Invalid email or password"}

    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


# -------------------------------
# Token refresh (built-in)
# -------------------------------

@router.post("/token/refresh")
def refresh_token(request):
    try:
        refresh = RefreshToken(data.refresh)
        return {"access": str(refresh.access_token)}
    except Exception:
        return 401, {"detail": "Invalid refresh token"}

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
    return {"message": "Authenticated!", "user_id": request.auth["user_id"]}