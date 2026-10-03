from django.contrib import admin

from .models import (
    Faculty,
    FacultyProfile,
    FacultyQualification,
    FacultyExperience,
)


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = (
        "faculty_id",
        "employee_id",
        "department",
        "designation",
        "employment_type",
        "joining_date",
        "status",
    )

    list_filter = (
        "status",
        "employment_type",
        "department",
    )

    search_fields = (
        "faculty_id",
        "employee_id",
        "designation",
        "profile__first_name",
        "profile__last_name",
        "profile__institutional_email",
    )

    ordering = ("faculty_id",)


@admin.register(FacultyProfile)
class FacultyProfileAdmin(admin.ModelAdmin):
    list_display = (
        "faculty",
        "first_name",
        "last_name",
        "gender",
        "phone_number",
        "institutional_email",
    )

    list_filter = (
        "gender",
        "blood_group",
    )

    search_fields = (
        "first_name",
        "last_name",
        "institutional_email",
        "phone_number",
        "faculty__faculty_id",
        "faculty__employee_id",
    )


@admin.register(FacultyQualification)
class FacultyQualificationAdmin(admin.ModelAdmin):
    list_display = (
        "faculty",
        "degree",
        "specialization",
        "institution",
        "university",
        "year_of_passing",
    )

    list_filter = (
        "degree",
        "year_of_passing",
    )

    search_fields = (
        "faculty__faculty_id",
        "degree",
        "specialization",
        "institution",
        "university",
    )

    ordering = ("-year_of_passing",)


@admin.register(FacultyExperience)
class FacultyExperienceAdmin(admin.ModelAdmin):
    list_display = (
        "faculty",
        "organization",
        "designation",
        "start_date",
        "end_date",
    )

    search_fields = (
        "faculty__faculty_id",
        "organization",
        "designation",
    )

    ordering = ("-start_date",)