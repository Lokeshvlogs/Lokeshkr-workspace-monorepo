"""One-time passcodes for phone verification and passwordless login."""
from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class OtpCode(models.Model):
    """A single issued passcode.

    Codes are stored hashed, never in plain text: a leaked database row must not
    hand someone a working login. Rows are kept after use rather than deleted so
    the resend cooldown and the audit trail survive a consumed code.
    """

    PURPOSE_SIGNUP = "signup"
    PURPOSE_LOGIN = "login"
    PURPOSE_PHONE_CHANGE = "phone_change"
    PURPOSE_CHOICES = [
        (PURPOSE_SIGNUP, "Sign-up verification"),
        (PURPOSE_LOGIN, "Passwordless login"),
        (PURPOSE_PHONE_CHANGE, "Phone number change"),
    ]

    #: Wrong guesses allowed before the code is burned.
    MAX_ATTEMPTS = 5

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="otp_codes",
        null=True,
        blank=True,
    )
    # Denormalised from Profile so a code can be issued before the account is
    # linked (Google sign-up collects the number separately) and so lookup does
    # not need a join.
    phone = models.CharField(max_length=15)
    country_code = models.CharField(max_length=8, blank=True)

    purpose = models.CharField(max_length=16, choices=PURPOSE_CHOICES)
    code_hash = models.CharField(max_length=128)

    expires_at = models.DateTimeField()
    attempts = models.PositiveIntegerField(default=0)
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["phone", "purpose", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.purpose} code for {self.country_code}{self.phone}"

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_consumed(self) -> bool:
        return self.consumed_at is not None

    @property
    def is_exhausted(self) -> bool:
        return self.attempts >= self.MAX_ATTEMPTS

    @property
    def is_usable(self) -> bool:
        return not (self.is_expired or self.is_consumed or self.is_exhausted)

    def seconds_until_resend(self) -> int:
        """Remaining cooldown before another code may be sent to this number."""
        cooldown = getattr(settings, "OTP_RESEND_COOLDOWN_SECONDS", 30)
        elapsed = (timezone.now() - self.created_at).total_seconds()
        return max(0, int(cooldown - elapsed))

    def consume(self) -> None:
        self.consumed_at = timezone.now()
        self.save(update_fields=["consumed_at"])
