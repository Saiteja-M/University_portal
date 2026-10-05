from django.core.exceptions import ValidationError
from django.db import models

from apps.academics.models import CourseOffering
from apps.faculty.models import Faculty


class TimetableSlot(models.Model):
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 1, "Monday"
        TUESDAY = 2, "Tuesday"
        WEDNESDAY = 3, "Wednesday"
        THURSDAY = 4, "Thursday"
        FRIDAY = 5, "Friday"
        SATURDAY = 6, "Saturday"
        SUNDAY = 7, "Sunday"

    offering = models.ForeignKey(
        CourseOffering, on_delete=models.PROTECT, related_name="timetable_slots"
    )
    faculty = models.ForeignKey(
        Faculty, on_delete=models.PROTECT, related_name="timetable_slots"
    )
    day_of_week = models.PositiveSmallIntegerField(choices=DayOfWeek.choices)
    period = models.PositiveSmallIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=100)
    building = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["day_of_week", "period", "start_time"]
        constraints = [
            models.UniqueConstraint(
                fields=["offering", "day_of_week", "period"],
                name="unique_offering_timetable_period",
            ),
            models.UniqueConstraint(
                fields=["room", "day_of_week", "period"],
                name="unique_room_timetable_period",
            ),
            models.UniqueConstraint(
                fields=["faculty", "day_of_week", "period"],
                name="unique_faculty_timetable_period",
            ),
        ]
        indexes = [
            models.Index(fields=["faculty", "day_of_week", "period"], name="tt_faculty_day_period_idx"),
            models.Index(fields=["day_of_week", "period"], name="tt_day_period_idx"),
        ]

    def clean(self):
        errors = {}
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            errors["end_time"] = "End time must be later than start time."
        if self.period < 1 or self.period > 12:
            errors["period"] = "Period must be between 1 and 12."
        if self.offering_id:
            if not self.offering.is_active:
                errors["offering"] = "The course offering is inactive."
            if self.offering.status in {"CLOSED", "CANCELLED"}:
                errors["offering"] = "Timetable cannot be created for a closed or cancelled offering."
            if self.faculty_id and not self.offering.faculty_assignments.filter(
                faculty_id=self.faculty_id, is_active=True
            ).exists():
                errors["faculty"] = "Faculty is not assigned to the selected course offering."
        if errors:
            raise ValidationError(errors)
