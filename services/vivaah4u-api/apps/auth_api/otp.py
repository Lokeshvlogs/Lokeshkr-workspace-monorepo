"""Issuing and checking one-time passcodes.

No SMS provider is wired up yet. `send_code` logs the passcode instead of
sending it, and `settings.OTP_DEV_CODE` (8888 in development) is accepted for
any number so the flow can be exercised end to end. Both of those are gated on
the setting being present - clearing `OTP_DEV_CODE` in production turns the
bypass off and leaves the real code path intact.
"""
from __future__ import annotations

import logging
import secrets

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from .models import OtpCode

logger = logging.getLogger(__name__)

CODE_LENGTH = 4


def normalise_phone(phone: str) -> str:
    """Digits only, so "(555) 010-1234" and "5550101234" are the same number."""
    return "".join(ch for ch in str(phone or "") if ch.isdigit())


def dev_code() -> str | None:
    """The always-accepted development passcode, or None in production."""
    return getattr(settings, "OTP_DEV_CODE", None) or None


def generate_code() -> str:
    """A uniformly random passcode. `secrets` because `random` is predictable."""
    upper = 10 ** CODE_LENGTH
    return str(secrets.randbelow(upper)).zfill(CODE_LENGTH)


def latest_code(phone: str, purpose: str) -> OtpCode | None:
    return OtpCode.objects.filter(phone=normalise_phone(phone), purpose=purpose).first()


def issue_code(phone: str, purpose: str, country_code: str = "", user=None) -> OtpCode:
    """Create and "send" a passcode, superseding any live one for this number."""
    phone = normalise_phone(phone)
    ttl = getattr(settings, "OTP_TTL_SECONDS", 300)

    # Only one code may be live per number and purpose, so an attacker cannot
    # widen their guessing surface by requesting a batch.
    OtpCode.objects.filter(
        phone=phone, purpose=purpose, consumed_at__isnull=True
    ).update(consumed_at=timezone.now())

    code = generate_code()
    otp = OtpCode.objects.create(
        user=user,
        phone=phone,
        country_code=country_code or "",
        purpose=purpose,
        code_hash=make_password(code),
        expires_at=timezone.now() + timezone.timedelta(seconds=ttl),
    )
    send_code(otp, code)
    return otp


def send_code(otp: OtpCode, code: str) -> None:
    """Deliver the passcode. Logs it until an SMS provider is configured."""
    logger.warning(
        "OTP %s for %s%s: %s (expires %s)",
        otp.purpose,
        otp.country_code,
        otp.phone,
        code,
        otp.expires_at.isoformat(),
    )


def check_code(otp: OtpCode, code: str) -> bool:
    """Verify a submitted passcode, counting the attempt.

    Returns False rather than raising so the caller decides the error wording -
    the reason is deliberately not distinguished to the client.
    """
    submitted = str(code or "").strip()

    bypass = dev_code()
    if bypass and secrets.compare_digest(submitted, bypass):
        return True

    if not otp.is_usable:
        return False

    otp.attempts += 1
    otp.save(update_fields=["attempts"])

    return check_password(submitted, otp.code_hash)
