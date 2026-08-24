from django.contrib import admin

from .models import Profile, ProfilePhoto


class ProfilePhotoInline(admin.TabularInline):
    model = ProfilePhoto
    extra = 0


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("profile_id", "first_name", "surname", "gender", "age", "profile_completeness")
    search_fields = ("profile_id", "first_name", "surname", "email", "user__username")
    list_filter = ("gender", "religion", "marital_status")
    inlines = [ProfilePhotoInline]


admin.site.register(ProfilePhoto)
