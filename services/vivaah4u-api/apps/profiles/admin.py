"""The staff console for diagnosing a member's account.

Shaped around the questions support actually gets - "why can't I log in", "why
am I not in matches", "I mistyped my gender" - rather than around the schema.
Three rules run through the file:

1. **Derived columns are read-only.** `Profile.save()` recomputes
   `profile_completeness`, `verification_level` and `verified_at` on every
   write, so a staff member who edits one of them in the form would save, see
   no error, and have the value silently discarded on the way to the database.

2. **Relationship history is read-only.** Interests, blocks and profile views
   are a record of what members did. Hand-editing them corrupts state the app
   maintains (`pair_key`, the interest state machine, the unread watermark), so
   they are listed and searchable but never editable.

3. **Actions that must not recompute use `.update()`.** Unlocking identity
   fields through `save()` would bump `updated_at` and rewrite completeness as
   a side effect of an unrelated repair.
"""

from django.contrib import admin, messages
from django.contrib.auth.models import User

from apps.auth_api.models import OtpCode

from .models import (
    Block,
    FamilyMember,
    Interest,
    Profile,
    ProfileEducation,
    ProfilePhoto,
    ProfileView,
)


class ReadOnlyAdmin(admin.ModelAdmin):
    """Visible and searchable, never editable. See rule 2 in the module docstring."""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# --- Inlines: the things that belong to one member ---------------------------

class ProfileEducationInline(admin.TabularInline):
    model = ProfileEducation
    extra = 0
    fields = ("position", "level", "field_of_study", "institution_name", "completion_year")


class FamilyMemberInline(admin.TabularInline):
    model = FamilyMember
    extra = 0
    fields = ("position", "relation", "name", "occupation", "is_married", "photo")


class ProfilePhotoInline(admin.TabularInline):
    model = ProfilePhoto
    extra = 0
    fields = ("position", "image", "created_at")
    readonly_fields = ("created_at",)


# --- The main console --------------------------------------------------------

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "profile_id",
        "first_name",
        "surname",
        "phone",
        "phone_verified",
        "verification_level",
        "profile_completeness",
        "is_active_account",
        "registered_at",
        "last_active_at",
    )
    list_filter = (
        "phone_verified",
        "verification_level",
        "gender",
        "hide",
        "hide_profile_from_search",
        "religion",
        "marital_status",
    )
    search_fields = (
        "profile_id",
        "first_name",
        "surname",
        "phone",
        "email",
        "user__username",
        "user__email",
    )
    ordering = ("-registered_at", "-id")
    list_select_related = ("user",)
    inlines = [ProfileEducationInline, FamilyMemberInline, ProfilePhotoInline]
    readonly_fields = (
        # Rule 1: recomputed by save(), so editing them here does nothing.
        "profile_completeness",
        "verification_level",
        "verified_at",
        # editable=False on the model; the "recompute and repair" action is the
        # only supported way to change it.
        "profile_id",
        "created_at",
        "updated_at",
        "identity_edits",
    )
    actions = [
        "unlock_identity_fields",
        "enable_accounts",
        "disable_accounts",
        "mark_phone_verified",
        "clear_otp_cooldown",
        "recompute_and_repair",
    ]

    @admin.display(boolean=True, description="Account enabled", ordering="user__is_active")
    def is_active_account(self, obj):
        return obj.user.is_active

    # --- Actions -------------------------------------------------------------

    @admin.action(description="Unlock identity fields (name / DOB / gender / height)")
    def unlock_identity_fields(self, request, queryset):
        # Rule 3: .update(), never save(). save() would recompute completeness
        # and bump updated_at, neither of which this repair should touch.
        count = queryset.update(identity_edits={})
        self.message_user(
            request,
            f"Cleared the identity edit ledger on {count} profile(s). "
            "Each group is answerable afresh, with its full allowance.",
            messages.SUCCESS,
        )

    @admin.action(description="Enable account (allow sign-in)")
    def enable_accounts(self, request, queryset):
        count = User.objects.filter(profile__in=queryset).update(is_active=True)
        self.message_user(request, f"Enabled {count} account(s).", messages.SUCCESS)

    @admin.action(description="Disable account (block new sign-ins)")
    def disable_accounts(self, request, queryset):
        count = User.objects.filter(profile__in=queryset).update(is_active=False)
        # Said plainly because the obvious reading of "disable" is wrong here:
        # is_active is checked when a token is issued, not when one is used.
        self.message_user(
            request,
            f"Disabled {count} account(s). This blocks new sign-ins only - an "
            "access token already issued keeps working until it expires.",
            messages.WARNING,
        )

    @admin.action(description="Mark phone verified")
    def mark_phone_verified(self, request, queryset):
        # Here the recompute IS the point: phone_verified is what lifts
        # verification_level, so this one goes through save().
        count = 0
        for profile in queryset:
            profile.phone_verified = True
            profile.save(update_fields=["phone_verified"])
            count += 1
        self.message_user(
            request,
            f"Marked {count} profile(s) phone-verified and re-derived their "
            "verification level.",
            messages.SUCCESS,
        )

    @admin.action(description="Clear OTP cooldown / attempt lockout")
    def clear_otp_cooldown(self, request, queryset):
        # Codes are stored hashed and are never recoverable, so "help them with
        # their OTP" can only mean clearing the rows that gate a resend. They
        # are kept after use for the cooldown and audit trail, so clearing the
        # block genuinely is a delete.
        phones = [phone for phone in queryset.values_list("phone", flat=True) if phone]
        deleted, _ = OtpCode.objects.filter(phone__in=phones).delete()
        self.message_user(
            request,
            f"Deleted {deleted} OTP row(s) for {len(phones)} number(s). "
            "They can request a new code immediately.",
            messages.SUCCESS,
        )

    @admin.action(description="Recompute completeness & repair missing profile ID")
    def recompute_and_repair(self, request, queryset):
        repaired = 0
        total = 0
        for profile in queryset:
            if not profile.profile_id and profile.gender and profile.age:
                profile.assign_profile_id(force=True)
                repaired += 1
            profile.save()
            total += 1
        self.message_user(
            request,
            f"Recomputed {total} profile(s); minted {repaired} missing profile ID(s).",
            messages.SUCCESS,
        )


# --- Relationship history, read-only ----------------------------------------

@admin.register(Interest)
class InterestAdmin(ReadOnlyAdmin):
    list_display = ("id", "sender", "receiver", "status", "created_at", "responded_at", "seen_at")
    list_filter = ("status",)
    search_fields = (
        "sender__profile_id",
        "receiver__profile_id",
        "sender__first_name",
        "receiver__first_name",
    )
    list_select_related = ("sender", "receiver")
    date_hierarchy = "created_at"


@admin.register(Block)
class BlockAdmin(ReadOnlyAdmin):
    list_display = ("id", "blocker", "blocked", "created_at")
    search_fields = ("blocker__profile_id", "blocked__profile_id")
    list_select_related = ("blocker", "blocked")


@admin.register(ProfileView)
class ProfileViewAdmin(ReadOnlyAdmin):
    list_display = ("id", "viewer", "viewed", "created_at")
    search_fields = ("viewer__profile_id", "viewed__profile_id")
    list_select_related = ("viewer", "viewed")
    date_hierarchy = "created_at"


# --- Editable detail, reachable on its own as well as inline -----------------

@admin.register(ProfileEducation)
class ProfileEducationAdmin(admin.ModelAdmin):
    list_display = ("profile", "position", "level", "field_of_study", "institution_name")
    search_fields = ("profile__profile_id", "institution_name")
    list_select_related = ("profile",)


@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ("profile", "position", "relation", "name", "occupation", "is_married")
    list_filter = ("relation", "is_married")
    search_fields = ("profile__profile_id", "name")
    list_select_related = ("profile",)


@admin.register(ProfilePhoto)
class ProfilePhotoAdmin(admin.ModelAdmin):
    list_display = ("profile", "position", "image", "created_at")
    search_fields = ("profile__profile_id",)
    list_select_related = ("profile",)
