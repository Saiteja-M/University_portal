from django.contrib import admin

from .models import Exam, StudentResult


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = (
        "name", "exam_type", "semester", "start_date", "end_date",
        "max_marks", "is_published", "is_active",
    )
    list_filter = ("exam_type", "semester", "is_published", "is_active")
    search_fields = ("name",)
    ordering = ("-start_date", "name")


@admin.register(StudentResult)
class StudentResultAdmin(admin.ModelAdmin):
    list_display = (
        "student", "exam", "course_offering", "marks", "grade",
        "grade_point", "status",
    )
    list_filter = ("exam", "course_offering", "status", "grade")
    search_fields = (
        "student__student_id", "student__admission_number",
        "course_offering__course__code", "course_offering__course__name",
        "course_offering__section", "exam__name",
    )
    readonly_fields = ("created_at", "updated_at")
