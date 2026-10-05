from django.contrib import admin

from .models import (
    AcademicYear,
    Course,
    Department,
    Program,
    Regulation,
    Semester,
    CourseOffering,
)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "is_active",
        "created_at",
    )
    search_fields = (
        "code",
        "name",
    )
    list_filter = (
        "is_active",
    )


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "department",
        "duration_years",
        "is_active",
    )
    search_fields = (
        "code",
        "name",
        "department__name",
    )
    list_filter = (
        "is_active",
        "department",
    )


@admin.register(Regulation)
class RegulationAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "program",
        "start_year",
        "end_year",
        "is_active",
    )
    search_fields = (
        "code",
        "name",
        "program__name",
    )
    list_filter = (
        "is_active",
        "program",
        "start_year",
    )


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "start_date",
        "end_date",
        "is_current",
    )
    search_fields = (
        "name",
    )
    list_filter = (
        "is_current",
    )


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = (
        "program",
        "academic_year",
        "number",
        "semester_type",
        "is_active",
    )
    search_fields = (
        "program__name",
        "academic_year__name",
    )
    list_filter = (
        "program",
        "academic_year",
        "semester_type",
        "is_active",
    )


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "regulation",
        "semester",
        "credits",
        "is_active",
    )
    search_fields = (
        "code",
        "name",
        "regulation__code",
        "semester__program__name",
    )
    list_filter = (
        "regulation",
        "semester",
        "is_active",
        "credits",
    )

@admin.register(CourseOffering)
class CourseOfferingAdmin(admin.ModelAdmin):
    list_display = (
        "course",
        "academic_year",
        "semester",
        "section",
        "capacity",
        "status",
        "is_active",
    )
    search_fields = (
        "course__code",
        "course__name",
        "section",
        "academic_year__name",
    )
    list_filter = (
        "status",
        "is_active",
        "academic_year",
        "semester",
    )
