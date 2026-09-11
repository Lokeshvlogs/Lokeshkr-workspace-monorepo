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


# ---- Media picks ----
#
# Music, films and reading are named picks rather than genre tags: a title the
# member typed, optionally with a link that was unfurled into artwork. Caps live
# here rather than on the model because model validators are never enforced -
# nothing calls full_clean and SQLite ignores max_length - so the mapping layer
# is the only real boundary.
MAX_PICKS = 8
MAX_PICK_TITLE = 120
MAX_PICK_SUBTITLE = 100
MAX_PICK_URL = 400

#: Hosts a pick may link to, keyed by the provider slug the client sends.
#:
#: Matched EXACTLY against a lowercased hostname, never by suffix: a suffix test
#: would let `evil-youtube.com` and `youtube.com.attacker.net` through.
PICK_LINK_HOSTS = {
    "youtube": {
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtu.be",
    },
    "spotify": {"open.spotify.com"},
    "imdb": {"imdb.com", "www.imdb.com", "m.imdb.com"},
    "goodreads": {"goodreads.com", "www.goodreads.com"},
    "googlebooks": {"books.google.com", "www.google.com"},
    "openlibrary": {"openlibrary.org"},
    "wattpad": {"wattpad.com", "www.wattpad.com"},
}

#: Image hosts a pick's artwork may be served from.
#:
#: Separate from PICK_LINK_HOSTS because artwork comes off a CDN, not off the
#: site the member linked to. This list is the thing standing between a crafted
#: save-step payload and an arbitrary URL that every viewer's browser fetches -
#: which is a working IP logger pointed at whoever opens the profile.
PICK_IMAGE_HOSTS = {
    "i.ytimg.com",
    "img.youtube.com",
    "i.scdn.co",
    "mosaic.scdn.co",
    "image-cdn-ak.spotifycdn.com",
    "image-cdn-fa.spotifycdn.com",
    "m.media-amazon.com",
    "images-na.ssl-images-amazon.com",
    "i.gr-assets.com",
    "images.gr-assets.com",
    "books.google.com",
    "books.googleusercontent.com",
    "covers.openlibrary.org",
    "img.wattpad.com",
}
