from django.contrib import admin

from .models import Exam, StudentResult


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "exam_type",
        "semester",
        "start_date",
        "end_date",
        "max_marks",
        "is_published",
        "is_active",
    )

    list_filter = (
        "exam_type",
        "semester",
        "is_published",
        "is_active",
    )

    search_fields = (
        "name",
    )

    ordering = (
        "-start_date",
        "name",
    )


@admin.register(StudentResult)
class StudentResultAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "exam",
        "course",
        "marks",
        "grade",
        "grade_point",
        "status",
    )

    list_filter = (
        "exam",
        "course",
        "status",
        "grade",
    )

    search_fields = (
        "student__student_id",
        "student__admission_number",
        "course__code",
        "course__name",
        "exam__name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )