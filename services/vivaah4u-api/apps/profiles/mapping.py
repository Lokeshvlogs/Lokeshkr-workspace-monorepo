"""Translation between the wizard's camelCase payloads and Profile's columns.

The Next.js profile wizard speaks camelCase and sends human-readable option
values ("male", "never_married"); the model stores snake_case columns and, for
ordered choice lists, integers. Keeping that translation in one place is what
stops `setattr(profile, "firstName", ...)` style silent no-ops.
"""
from __future__ import annotations

import base64
import binascii
import uuid
from datetime import datetime

from django.core.files.base import ContentFile
from django.utils import timezone

from . import education, managed_by as managed_by_rules

# camelCase key sent by the wizard -> model field name
CAMEL_TO_MODEL = {
    # Step 0 - basic details
    "firstName": "first_name",
    "surname": "surname",
    "dob": "dob_time",
    "gender": "gender",
    "heightFeet": "height_feet",
    "heightInches": "height_inches",
    "bodyPhysique": "body_physique",
    "maritalStatus": "marital_status",
    "manglikLevel": "manglik_level",
    # Step 1 - social background
    "religion": "religion",
    "community": "community",
    "mothertongue": "mother_tongue",
    "currentCountry": "current_country",
    "currentCity": "current_city",
    "placeOfBirthCountry": "place_of_birth_country",
    "placeOfBirthCity": "place_of_birth_city",
    "citizenshipCountry": "citizenship_country",
    "familyLivingInCountry": "family_living_in_country",
    "familyLivingInCity": "family_living_in_city",
    "familyIncome": "family_income",
    "familyType": "family_type",
    "livesWithFamily": "lives_with_family",
    # Step 2 - education and profession
    "educationLevel": "education_level",
    "fieldOfStudy": "field_of_study",
    "collegeUniversity": "college_university",
    "profession": "profession",
    "employedIn": "employed_in",
    "employedAs": "employed_as",
    "salaryAmount": "annual_income",
    # Step 3 - lifestyle
    "diet": "diet",
    "smoking": "smoking_habits",
    "drinking": "drinking_habits",
    "hasChildren": "has_children",
    "religiosity": "religiosity",
    "religiosityDetail": "religiosity_detail",
    "aboutMe": "about_me",
    # Family background (optional)
    "fatherOccupation": "father_occupation",
    "motherOccupation": "mother_occupation",
    "brothers": "brothers",
    "brothersMarried": "brothers_married",
    "sisters": "sisters",
    "sistersMarried": "sisters_married",
    "familyAbout": "family_about",
    # Partner preference
    "partnerAgeMin": "partner_age_min",
    "partnerAgeMax": "partner_age_max",
    "partnerHeightMin": "partner_height_min",
    "partnerHeightMax": "partner_height_max",
    "partnerMaritalStatus": "partner_marital_status",
    "partnerReligion": "partner_religion",
    "partnerCommunity": "partner_community",
    "partnerMotherTongue": "partner_mother_tongue",
    "partnerCountry": "partner_country",
    "partnerEducation": "partner_education",
    "partnerProfession": "partner_profession",
    "partnerDiet": "partner_diet",
    "partnerAbout": "partner_about",
    # Multi-value partner preferences. These supersede the singular keys above,
    # which stay mapped for one release so an older client still saves.
    "partnerMaritalStatuses": "partner_marital_statuses",
    "partnerReligions": "partner_religions",
    "partnerCommunities": "partner_communities",
    "partnerMotherTongues": "partner_mother_tongues",
    "partnerCountries": "partner_countries",
    "partnerEducations": "partner_educations",
    "partnerProfessions": "partner_professions",
    "partnerDiets": "partner_diets",
    # Interests. `dailyRoutine` maps a column that has existed since the first
    # migration and was never wired to anything.
    "interestsMusic": "interests_music",
    "interestsMovies": "interests_movies",
    "interestsBooks": "interests_books",
    "interestsCuisines": "interests_cuisines",
    "interestsTravel": "interests_travel",
    "interestsHobbies": "interests_hobbies",
    "interestsOther": "interests_other",
    "dailyRoutine": "daily_routine",
    # Where the job is, and the residency status that makes sense there.
    "workCountry": "work_country",
    "visaStatus": "visa_status",
    # Mobility, and the career-side counterpart.
    "managedBy": "managed_by",
    "settleAbroad": "settle_abroad",
    "partnerRelocateAfterMarriage": "partner_relocate_after_marriage",
    "partnerSettleAbroad": "partner_settle_abroad",
}

MODEL_TO_CAMEL = {v: k for k, v in CAMEL_TO_MODEL.items()}

GENDER_TO_MODEL = {"male": "M", "female": "F", "other": "O"}
GENDER_TO_API = {"M": "male", "F": "female", "O": "other"}

MARITAL_TO_MODEL = {
    "never_married": 0,
    "married": 1,
    "divorced": 2,
    "widowed": 3,
    "annulled": 4,
    "awaiting_divorce": 5,
}
MARITAL_TO_API = {v: k for k, v in MARITAL_TO_MODEL.items()}

INT_FIELDS = {
    "height_feet",
    "height_inches",
    "manglik_level",
    "family_type",
    "brothers",
    "brothers_married",
    "sisters",
    "sisters_married",
}
# Blank means "no preference", so these stay NULL rather than coercing to 0.
NULLABLE_INT_FIELDS = {
    "partner_age_min",
    "partner_age_max",
    "partner_height_min",
    "partner_height_max",
}
BOOL_FIELDS = {"lives_with_family", "has_children"}

# JSON list columns. An empty list is a real answer ("no preference"), so these
# must accept [] rather than treating it as "unset".
JSON_LIST_FIELDS = {
    "interests_music",
    "interests_movies",
    "interests_books",
    "interests_cuisines",
    "interests_travel",
    "interests_hobbies",
    "partner_marital_statuses",
    "partner_religions",
    "partner_communities",
    "partner_mother_tongues",
    "partner_countries",
    "partner_educations",
    "partner_professions",
    "partner_diets",
    "partner_relocate_after_marriage",
    "partner_settle_abroad",
}

# Fields an explicit null may legitimately clear. Everywhere else `None` still
# means "not in this payload" - see apply_payload.
NULLABLE_FIELDS = NULLABLE_INT_FIELDS

# Caps applied on the way in. Model validators are never enforced (nothing calls
# full_clean, and SQLite ignores max_length), so without these the JSON columns
# are an unbounded storage-write primitive for any authenticated user.
MAX_LIST_ITEMS = 15
MAX_LIST_VALUE_LENGTH = 60

# How a dropdown says "no preference". Stored as an empty list instead, so the
# two never have to be kept in agreement.
NO_PREFERENCE = "any"


def _to_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_str_list(value, field: str) -> list:
    """Normalise whatever arrived into a clean list of option values.

    Accepts a bare string as well as a list: during the release where the
    singular columns still exist, an older client may send one.
    """
    if value in (None, ""):
        return []

    if isinstance(value, str):
        items = [value]
    elif isinstance(value, (list, tuple)):
        items = list(value)
    else:
        # A dict where a list belongs is a client bug. Coercing it silently is
        # how a JSON column ends up holding something nothing can render.
        raise ValueError(f"{field} must be a list of values")

    cleaned = []
    seen = set()
    for item in items:
        if item is None:
            continue
        text = str(item).strip()[:MAX_LIST_VALUE_LENGTH]
        # "any" is not a value, it is the absence of one.
        if not text or text == NO_PREFERENCE or text in seen:
            continue
        seen.add(text)
        cleaned.append(text)

    return cleaned[:MAX_LIST_ITEMS]


def parse_dob(value):
    """Accept YYYY-MM-DD or YYYY-MM-DDTHH:MM from the date and time pickers."""
    if not value:
        return None
    raw = str(value).strip()
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d"):
        try:
            parsed = datetime.strptime(raw, fmt)
        except ValueError:
            continue
        if timezone.is_naive(parsed):
            parsed = timezone.make_aware(parsed, timezone.get_default_timezone())
        return parsed
    return None


def decode_data_url(data_url: str):
    """Turn the wizard base64 preview into a saveable image file.

    Returns None for anything that is not a well-formed image data URL (an
    already-uploaded https URL round-tripping back to us, for example).
    """
    if not data_url or not data_url.startswith("data:image/"):
        return None
    try:
        header, encoded = data_url.split(",", 1)
        extension = header.split("/", 1)[1].split(";", 1)[0].lower()
        if extension not in {"jpeg", "jpg", "png", "webp", "gif"}:
            return None
        raw = base64.b64decode(encoded, validate=True)
    except (ValueError, IndexError, binascii.Error):
        return None
    if len(raw) > 5 * 1024 * 1024:
        return None
    return ContentFile(raw, name=f"{uuid.uuid4().hex}.{extension}")


def sync_gallery(profile, entries) -> None:
    """Reconcile the gallery against the full list the client sent.

    Entries are either data URLs (newly added) or URLs of photos already stored.
    Anything omitted from the list is deleted, so the client can express adds,
    removes and reordering with one payload and no photo ids.
    """
    from .models import ProfilePhoto

    if entries is None:
        return
    if not isinstance(entries, (list, tuple)):
        return

    existing = list(profile.photos.all())
    by_url = {p.image.url: p for p in existing if p.image}
    keep = []

    for position, entry in enumerate(entries[: ProfilePhoto.MAX_PER_PROFILE]):
        if not isinstance(entry, str) or not entry:
            continue

        image = decode_data_url(entry)
        if image is not None:
            photo = ProfilePhoto(profile=profile, position=position)
            photo.image.save(image.name, image, save=True)
            keep.append(photo.pk)
            continue

        # Not a data URL - an already-stored photo coming back unchanged.
        match = next((p for url, p in by_url.items() if entry.endswith(url)), None)
        if match is not None:
            if match.position != position:
                match.position = position
                match.save(update_fields=["position"])
            keep.append(match.pk)

    profile.photos.exclude(pk__in=keep).delete()


MAX_ACHIEVEMENTS = 10
MAX_ACHIEVEMENT_TITLE = 120
MAX_ACHIEVEMENT_DETAIL = 400


def sync_educations(profile, entries) -> None:
    """Replace the education rows with exactly what the client sent.

    Same contract as `sync_gallery`: the list is the complete desired state and
    an omission is a deletion. With at most five tiny rows, delete-and-recreate
    is simpler and safer than reconciling - no row ids leak to the client, so
    there is nothing for it to get wrong. Both run inside the transaction that
    `update_profile_step` opens.
    """
    from .models import ProfileEducation

    if entries is None:
        return
    if not isinstance(entries, (list, tuple)):
        raise ValueError("educations must be a list")

    rows = []
    # Same reasoning as clean_achievements: count kept rows rather than slicing
    # the input, because the editor always leaves one empty row on screen and
    # that blank must not cost a real qualification its place.
    for raw in entries:
        if len(rows) >= ProfileEducation.MAX_PER_PROFILE:
            break
        if not isinstance(raw, dict):
            raise ValueError("each education entry must be an object")

        level = str(raw.get("level") or "").strip()[:40]
        if not level:
            # A row with no level says nothing and would break rank ordering.
            continue

        slug = str(raw.get("institutionSlug") or "").strip()
        is_other = bool(raw.get("isOther")) or slug == "other"

        institution = None
        name = str(raw.get("institutionName") or "").strip()[:200]
        country = str(raw.get("country") or "").strip().upper()[:2]

        if slug and not is_other:
            institution = _resolve_institution(slug)
            if institution is not None:
                # Trust the catalog, never the client, for a resolved row -
                # otherwise a payload could pair slug=iit_bombay with
                # name="Harvard" and the profile would display the lie.
                name = institution.name
                country = institution.country
            else:
                # Unknown slug: keep whatever name came with it, but treat it
                # as unlisted so it cannot inherit a reputation it has not got.
                is_other = True

        # School-level rows never carry a reputation claim, whatever was sent.
        claimed = bool(raw.get("reputationClaimed")) and not education.is_school_level(level)

        year = raw.get("completionYear")
        year = _to_int(year, None) if year not in ("", None) else None
        if year is not None and not (1950 <= year <= 2100):
            year = None

        rows.append(
            ProfileEducation(
                profile=profile,
                position=len(rows),
                level=level,
                field_of_study=str(raw.get("fieldOfStudy") or "").strip()[:120],
                country=country,
                institution=institution,
                institution_name=name,
                institution_country=country,
                is_other=is_other and bool(name),
                reputation_claimed=claimed,
                completion_year=year,
            )
        )

    profile.educations.all().delete()
    if rows:
        ProfileEducation.objects.bulk_create(rows)


def _resolve_institution(slug: str):
    from apps.catalog.models import Institution

    return Institution.objects.filter(slug=slug, is_active=True).first()


def apply_employer(profile, slug: str, name: str) -> None:
    """Set the employer from a catalog slug, or as free text.

    Same rule as institutions: when a slug resolves, the NAME comes from the
    catalog and the client's is discarded - otherwise a payload could pair
    slug=google with name="Prime Minister of India" and the profile would show
    it. Anything unresolved is stored as free text with no reputation, which is
    honest: an employer we have never heard of is unknown, not bad.
    """
    from apps.catalog.models import Employer

    slug = (slug or "").strip()
    name = (name or "").strip()[:200]

    if slug and slug != "other":
        employer = Employer.objects.filter(slug=slug, is_active=True).first()
        if employer is not None:
            profile.employer = employer
            profile.employer_name = employer.name
            profile.employer_is_other = False
            profile.employer_reputation_tier = employer.reputation_tier
            return

    profile.employer = None
    profile.employer_name = name
    profile.employer_is_other = bool(name)
    # No tier for an unlisted employer. There is no self-claim here on purpose:
    # a company either is well known enough to be in the catalog or it is not,
    # and asking members to rate their own workplace invites everyone to say yes.
    profile.employer_reputation_tier = education.NO_REPUTATION


def clean_achievements(value) -> list:
    """Normalise the achievements list. Display-only, so shape is all we check."""
    if value in (None, ""):
        return []
    if not isinstance(value, (list, tuple)):
        raise ValueError("achievements must be a list")

    cleaned = []
    # Counts VALID entries, rather than slicing the raw list first: the UI keeps
    # a trailing blank row, and capping before filtering would let that blank
    # consume a slot and silently drop a real achievement. The loop still stops
    # at the cap, so an oversized payload is bounded either way.
    for raw in value:
        if len(cleaned) >= MAX_ACHIEVEMENTS:
            break
        if isinstance(raw, str):
            raw = {"title": raw}
        if not isinstance(raw, dict):
            raise ValueError("each achievement must be an object")

        title = str(raw.get("title") or "").strip()[:MAX_ACHIEVEMENT_TITLE]
        if not title:
            continue

        year = raw.get("year")
        year = _to_int(year, None) if year not in ("", None) else None

        cleaned.append({
            "title": title,
            "year": year if year and 1950 <= year <= 2100 else None,
            "detail": str(raw.get("detail") or "").strip()[:MAX_ACHIEVEMENT_DETAIL],
        })

    return cleaned


def apply_payload(profile, payload: dict) -> list:
    """Write camelCase wizard values onto the profile. Returns fields touched."""
    touched = []

    for camel_key, value in payload.items():
        if camel_key == "photos":
            sync_gallery(profile, value)
            touched.append("photos")
            continue

        if camel_key == "educations":
            # Intercepted before the column mapping, like photos: this writes
            # related rows, not a field on Profile.
            sync_educations(profile, value)
            profile.refresh_derived_education()
            touched.append("educations")
            continue

        if camel_key == "achievements":
            profile.achievements = clean_achievements(value)
            touched.append("achievements")
            continue

        if camel_key == "employerSlug":
            # Paired with employerName, so it is resolved here rather than
            # through the column map.
            apply_employer(profile, value, payload.get("employerName", ""))
            touched.append("employer")
            continue

        if camel_key == "employerName":
            # Handled by the employerSlug branch. Only acted on alone, for a
            # payload that sends the name without a slug.
            if "employerSlug" not in payload:
                apply_employer(profile, "", value)
                touched.append("employer")
            continue

        if camel_key == "photo":
            image = decode_data_url(value)
            if image is not None:
                profile.display_picture.save(image.name, image, save=False)
                touched.append("display_picture")
            continue

        field = CAMEL_TO_MODEL.get(camel_key)
        if field is None:
            continue

        # `None` means "absent from this payload" for most fields, because the
        # wizard PATCHes one step at a time and must not blank the others. The
        # exception is the fields where null is itself the answer.
        if value is None:
            if field in NULLABLE_FIELDS:
                setattr(profile, field, None)
                touched.append(field)
            continue

        if field in JSON_LIST_FIELDS:
            value = _to_str_list(value, camel_key)
        elif field == "dob_time":
            parsed = parse_dob(value)
            if parsed is None:
                continue
            value = parsed
        elif field == "gender":
            value = GENDER_TO_MODEL.get(str(value).lower(), str(value)[:1].upper())
        elif field == "marital_status":
            value = MARITAL_TO_MODEL.get(str(value), _to_int(value))
        elif field in BOOL_FIELDS:
            value = bool(value)
        elif field in NULLABLE_INT_FIELDS:
            value = None if value in ("", None) else _to_int(value, None)
        elif field in INT_FIELDS:
            value = _to_int(value)
        elif isinstance(value, str):
            value = value.strip()

        setattr(profile, field, value)
        touched.append(field)

    return touched


def profile_to_api(profile, request=None, public: bool = False) -> dict:
    """Serialise a Profile back into the camelCase shape the frontend expects."""
    picture = None
    if profile.display_picture:
        try:
            picture = (
                request.build_absolute_uri(profile.display_picture.url)
                if request
                else profile.display_picture.url
            )
        except ValueError:
            picture = None

    gallery = []
    for photo in profile.photos.all():
        if not photo.image:
            continue
        try:
            gallery.append(
                request.build_absolute_uri(photo.image.url) if request else photo.image.url
            )
        except ValueError:
            continue

    data = {
        "profile_id": profile.profile_id or "",
        "firstName": profile.first_name,
        "surname": profile.surname,
        "gender": GENDER_TO_API.get(profile.gender, "other"),
        "age": profile.age,
        "heightFeet": profile.height_feet,
        "heightInches": profile.height_inches,
        "bodyPhysique": profile.body_physique,
        "maritalStatus": MARITAL_TO_API.get(profile.marital_status, "never_married"),
        "manglikLevel": profile.manglik_level,
        "religion": profile.religion,
        "community": profile.community,
        "mothertongue": profile.mother_tongue,
        "currentCountry": profile.current_country,
        "currentCity": profile.current_city,
        "placeOfBirthCountry": profile.place_of_birth_country,
        "placeOfBirthCity": profile.place_of_birth_city,
        "citizenshipCountry": profile.citizenship_country,
        "familyLivingInCountry": profile.family_living_in_country,
        "familyLivingInCity": profile.family_living_in_city,
        "familyIncome": profile.family_income,
        "familyType": profile.family_type,
        "livesWithFamily": profile.lives_with_family,
        "educationLevel": profile.education_level,
        "fieldOfStudy": profile.field_of_study,
        "collegeUniversity": profile.college_university,
        "profession": profile.profession,
        "employedIn": profile.employed_in,
        "employedAs": profile.employed_as,
        "salaryAmount": profile.annual_income,
        "diet": profile.diet,
        "smoking": profile.smoking_habits,
        "drinking": profile.drinking_habits,
        "hasChildren": profile.has_children,
        "religiosity": profile.religiosity,
        "religiosityDetail": profile.religiosity_detail,
        "aboutMe": profile.about_me,
        "fatherOccupation": profile.father_occupation,
        "motherOccupation": profile.mother_occupation,
        "brothers": profile.brothers,
        "brothersMarried": profile.brothers_married,
        "sisters": profile.sisters,
        "sistersMarried": profile.sisters_married,
        "familyAbout": profile.family_about,
        "partnerAgeMin": profile.partner_age_min,
        "partnerAgeMax": profile.partner_age_max,
        "partnerHeightMin": profile.partner_height_min,
        "partnerHeightMax": profile.partner_height_max,
        "partnerMaritalStatus": profile.partner_marital_status,
        "partnerReligion": profile.partner_religion,
        "partnerCommunity": profile.partner_community,
        "partnerMotherTongue": profile.partner_mother_tongue,
        "partnerCountry": profile.partner_country,
        "partnerEducation": profile.partner_education,
        "partnerProfession": profile.partner_profession,
        "partnerDiet": profile.partner_diet,
        "partnerAbout": profile.partner_about,
        # Both shapes travel for one release. The client reads the plural; the
        # singular exists only so a client that has not been redeployed does not
        # break. Delete the singular keys once that window has passed.
        "partnerMaritalStatuses": profile.partner_marital_statuses or [],
        "partnerReligions": profile.partner_religions or [],
        "partnerCommunities": profile.partner_communities or [],
        "partnerMotherTongues": profile.partner_mother_tongues or [],
        "partnerCountries": profile.partner_countries or [],
        "partnerEducations": profile.partner_educations or [],
        "partnerProfessions": profile.partner_professions or [],
        "partnerDiets": profile.partner_diets or [],
        "interestsMusic": profile.interests_music or [],
        "interestsMovies": profile.interests_movies or [],
        "interestsBooks": profile.interests_books or [],
        "interestsCuisines": profile.interests_cuisines or [],
        "interestsTravel": profile.interests_travel or [],
        "interestsHobbies": profile.interests_hobbies or [],
        "interestsOther": profile.interests_other,
        "dailyRoutine": profile.daily_routine,
        # employerSlug lets the wizard re-select the catalog row; the tier
        # behind it is internal and never travels.
        "employerSlug": profile.employer.slug if profile.employer_id else "",
        "employerName": profile.employer_name,
        "workCountry": profile.work_country,
        "visaStatus": profile.visa_status,
        "settleAbroad": profile.settle_abroad,
        "partnerRelocateAfterMarriage": profile.partner_relocate_after_marriage or [],
        "partnerSettleAbroad": profile.partner_settle_abroad or [],
        "achievements": profile.achievements or [],
        # The institution's reputation tier is deliberately absent: it is the
        # product's own judgement, and a member who could read it would know
        # exactly which answer scores best.
        #
        # `reputationClaimed` is absent too on public payloads - see below. It
        # is an input to that scoring, and showing other members that someone
        # ticked "well regarded" about their own college serves nobody.
        "educations": [
            {
                "level": entry.level,
                "fieldOfStudy": entry.field_of_study,
                "country": entry.country,
                "institutionSlug": entry.institution.slug if entry.institution_id else "",
                "institutionName": entry.institution_name,
                "isOther": entry.is_other,
                "completionYear": entry.completion_year,
                **({} if public else {"reputationClaimed": entry.reputation_claimed}),
            }
            for entry in profile.educations.select_related("institution").all()
        ],
        "photo": picture,
        "photos": gallery,
        "profile_completeness": profile.profile_completeness,
        # Public on purpose: a trust signal is worthless if only its owner can
        # see it. Only the derived level travels - the evidence flags behind it
        # (phone_verified, id_document_verified, ...) stay server-side, so the
        # client cannot infer which checks a member has or has not passed.
        "verification_level": profile.verification_level,
        # Public on purpose: knowing whether you are about to talk to the
        # member or to their father is useful before the first message.
        #
        # The DERIVED value travels, never raw `profile_for` - "son" would
        # leak the member's gender a second time and reads oddly on someone
        # else's profile.
        "managedBy": managed_by_rules.resolve(profile.managed_by, profile.profile_for),
        "managedByLabel": managed_by_rules.label_for(
            profile.managed_by, profile.profile_for, owner=not public
        ),
    }

    if not public:
        # Contact details and the exact birth timestamp stay off public pages.
        data.update(
            {
                "email": profile.email,
                "phone": profile.phone,
                "countryCode": profile.country_code,
                "profileFor": profile.profile_for,
                "lookingFor": profile.looking_for,
                "dob": profile.dob_time.isoformat() if profile.dob_time else None,
                "created_at": profile.created_at.isoformat(),
                "updated_at": profile.updated_at.isoformat(),
            }
        )

    return data
