from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import OTPRecord, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "user_type",
        "employee_or_student_id",
        "phone_number",
        "is_student_registered",
    )
    list_filter = (
        "user_type",
        "is_student_registered",
    )
    search_fields = (
        "user__username",
        "user__email",
        "employee_or_student_id",
        "phone_number",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(OTPRecord)
class OTPRecordAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "purpose",
        "channel",
        "destination",
        "attempt_count",
        "expires_at",
        "used_at",
        "created_at",
    )
    list_filter = (
        "purpose",
        "channel",
    )
    search_fields = (
        "student__student_id",
        "destination",
    )
    readonly_fields = (
        "otp_hash",
        "challenge_token_hash",
        "created_at",
        "updated_at",
    )