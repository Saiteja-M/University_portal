from django.contrib import admin

from .models import AttendanceRecord, AttendanceSession


@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = (
        "course",
        "faculty",
        "academic_year",
        "semester",
        "session_date",
        "period",
    )

    list_filter = (
        "academic_year",
        "semester",
        "session_date",
    )

    search_fields = (
        "course__code",
        "course__name",
        "faculty__employee_id",
        "faculty__user__first_name",
        "faculty__user__last_name",
    )

    ordering = (
        "-session_date",
        "period",
        "course__code",
    )

    autocomplete_fields = (
        "faculty",
        "course",
        "academic_year",
        "semester",
    )


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "session",
        "status",
        "marked_at",
    )

    list_filter = (
        "status",
        "session__session_date",
    )

    search_fields = (
        "student__student_id",
        "student__user__first_name",
        "student__user__last_name",
    )

    ordering = (
        "-marked_at",
        "student",
    )

    autocomplete_fields = (
        "session",
    )