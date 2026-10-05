from django.contrib import admin
from .models import Assignment, AssignmentSubmission

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "offering", "due_date", "max_marks", "status", "is_active")
    list_filter = ("status", "is_active")
    search_fields = ("title", "offering__course__code", "offering__course__name")

@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("assignment", "student", "submitted_at", "marks", "status")
    list_filter = ("status",)
    search_fields = ("assignment__title", "student__student_id")
