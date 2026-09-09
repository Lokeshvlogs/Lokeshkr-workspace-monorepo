from ninja import NinjaAPI, Schema

from ninja_extra import NinjaExtraAPI
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.controller import NinjaJWTDefaultController

from apps.auth_api.api import router as auth_router
from apps.profiles.api import router as profile_router
from apps.profiles.interests_api import router as interests_router
from apps.profiles.family_api import router as family_router
from apps.catalog.api import router as catalog_router
from apps.messaging.api import router as messaging_router


api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController)

api.add_router("/auth_api/", auth_router)
api.add_router("/profiles/", profile_router)
api.add_router("/interests/", interests_router)
api.add_router("/family/", family_router)
api.add_router("/catalog/", catalog_router)
api.add_router("/messaging/", messaging_router)
