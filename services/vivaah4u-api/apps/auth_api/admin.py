"""OTP rows, read-only.

The console cannot show anyone their code and should not pretend otherwise:
`code_hash` is a hash and the plaintext is never stored, so it is excluded from
the form entirely rather than displayed as an unhelpful digest.

What a stuck member actually needs is here instead - whether the latest code is
expired, already consumed, or attempt-exhausted, which is the difference between
"the SMS never arrived" and "they typed it wrong five times". Clearing the block
is a delete, and lives as an action on the profile console
(`apps.profiles.admin.ProfileAdmin.clear_otp_cooldown`) where the member is
identified by profile rather than by a bare phone number.
"""

from django.contrib import admin

from .models import OtpCode


@admin.register(OtpCode)
class OtpCodeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "country_code",
        "phone",
        "purpose",
        "usable",
        "expired",
        "consumed",
        "attempts",
        "created_at",
        "expires_at",
    )
    list_filter = ("purpose",)
    search_fields = ("phone", "user__username", "user__email")
    ordering = ("-created_at",)
    list_select_related = ("user",)
    date_hierarchy = "created_at"
    # Everything except the hash. Listed explicitly so a future column has to be
    # opted in rather than exposed by default.
    fields = (
        "user",
        "country_code",
        "phone",
        "purpose",
        "attempts",
        "created_at",
        "expires_at",
        "consumed_at",
    )
    readonly_fields = fields

    @admin.display(boolean=True, description="Usable")
    def usable(self, obj):
        return obj.is_usable

    @admin.display(boolean=True, description="Expired")
    def expired(self, obj):
        return obj.is_expired

    @admin.display(boolean=True, description="Consumed")
    def consumed(self, obj):
        return obj.is_consumed

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
