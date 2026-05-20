from ninja import NinjaAPI, Schema

from ninja_extra import NinjaExtraAPI
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.controller import NinjaJWTDefaultController

from apps.auth_api.api import router as auth_router
from apps.profiles.api import router as profile_router


api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController)

api.add_router("/auth_api/", auth_router)
api.add_router("/profiles/", profile_router)