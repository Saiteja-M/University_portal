from django.contrib import admin
from .models import TimetableSlot


@admin.register(TimetableSlot)
class TimetableSlotAdmin(admin.ModelAdmin):
    list_display = ("offering", "faculty", "day_of_week", "period", "start_time", "end_time", "room", "is_active")
    list_filter = ("day_of_week", "is_active")
    search_fields = ("offering__course__code", "offering__course__name", "room", "faculty__faculty_id")
