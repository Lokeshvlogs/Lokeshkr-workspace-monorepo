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
    "routine": "daily_routine",
    "exercise": "exercise_habits",
    "religiousness": "religiousness",
    "astrologyBelief": "astrology_belief",
    "hasChildren": "has_children",
    "wantsChildren": "wants_children",
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
    "exercise_habits",
    "religiousness",
    "astrology_belief",
}
BOOL_FIELDS = {"lives_with_family", "has_children", "wants_children"}


def _to_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


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


def apply_payload(profile, payload: dict) -> list:
    """Write camelCase wizard values onto the profile. Returns fields touched."""
    touched = []

    for camel_key, value in payload.items():
        if camel_key == "photo":
            image = decode_data_url(value)
            if image is not None:
                profile.display_picture.save(image.name, image, save=False)
                touched.append("display_picture")
            continue

        field = CAMEL_TO_MODEL.get(camel_key)
        if field is None or value is None:
            continue

        if field == "dob_time":
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
        "routine": profile.daily_routine,
        "exercise": profile.exercise_habits,
        "religiousness": profile.religiousness,
        "astrologyBelief": profile.astrology_belief,
        "hasChildren": profile.has_children,
        "wantsChildren": profile.wants_children,
        "photo": picture,
        "profile_completeness": profile.profile_completeness,
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
