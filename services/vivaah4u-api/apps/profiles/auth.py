"""Authentication classes that also record presence.

The stamp hangs off authentication rather than middleware on purpose:
`AuthenticationMiddleware` resolves `request.user` from the session, but this
API authenticates with a Bearer JWT resolved inside the ninja operation - in
middleware every real API call still looks anonymous. Authentication is also
the one place that runs exactly once per authenticated request, after the
signature has been verified, so an invalid token can never stamp anybody.
"""

from ninja_jwt.authentication import JWTAuth

from . import presence


class ActiveJWTAuth(JWTAuth):
    """JWTAuth that records that the member is currently using the product."""

    def authenticate(self, request, token):
        user = super().authenticate(request, token)
        if user is not None:
            presence.touch(user)
        return user


class OptionalActiveJWTAuth(ActiveJWTAuth):
    """Authenticates when a token is present, and lets the request through when not.

    For endpoints that are genuinely public but show more to a signed-in
    viewer. Returning a sentinel rather than None is what stops ninja treating
    an absent token as a 401; the operation reads `request.auth` and finds
    `False` for an anonymous caller.
    """

    def authenticate(self, request, token):
        return super().authenticate(request, token) or False

    def __call__(self, request):
        # No Authorization header at all - still allowed, just not identified.
        return super().__call__(request) or False


#: JWTAuth is stateless, so one shared instance serves every route.
active_auth = ActiveJWTAuth()
optional_auth = OptionalActiveJWTAuth()
