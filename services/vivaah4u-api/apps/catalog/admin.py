from django.contrib import admin

from .models import Employer, Institution


class CatalogAdmin(admin.ModelAdmin):
    """Reputation is editable here and nowhere else.

    It never reaches the API, so the admin is the only place a curator can
    correct a tier the bulk seed got wrong.
    """

    list_display = ("name", "country", "reputation_tier", "reputation_source",
                    "profile_count", "is_active")
    list_filter = ("country", "reputation_tier", "reputation_source", "is_active")
    search_fields = ("name", "slug", "search_blob")
    ordering = ("country", "name")
    readonly_fields = ("search_blob", "profile_count", "created_at", "updated_at")


@admin.register(Institution)
class InstitutionAdmin(CatalogAdmin):
    list_display = CatalogAdmin.list_display + ("kind",)
    list_filter = CatalogAdmin.list_filter + ("kind",)


@admin.register(Employer)
class EmployerAdmin(CatalogAdmin):
    list_display = CatalogAdmin.list_display + ("industry",)
    list_filter = CatalogAdmin.list_filter + ("industry",)
