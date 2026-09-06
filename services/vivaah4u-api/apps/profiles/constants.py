"""Values shared by more than one app.

`PROFILE_COMPLETE_THRESHOLD` used to be declared twice - once in
`apps.profiles.api` and once in `apps.auth_api.api` - and it gates both whether
a member appears in matches and whether login bounces them back into the
wizard. Two copies of a number with that reach is a desync waiting to happen.
"""

# A profile whose CORE completeness is below this is still "in setup": it is
# kept out of match results and login redirects to the registration wizard.
#
# Deliberately measured against the core field set only (see
# `Profile.core_completeness`), never the headline percentage. The headline
# number grows as the wizard asks for more, and eligibility must not move
# underneath existing members every time it does.
PROFILE_COMPLETE_THRESHOLD = 95
