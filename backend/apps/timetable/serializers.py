from rest_framework import serializers

from apps.academics.models import CourseOffering
from apps.faculty.models import Faculty
from .models import TimetableSlot


class TimetableSlotSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source="offering.course.code", read_only=True)
    course_name = serializers.CharField(source="offering.course.name", read_only=True)
    section = serializers.CharField(source="offering.section", read_only=True)
    academic_year_name = serializers.CharField(source="offering.academic_year.name", read_only=True)
    semester_number = serializers.IntegerField(source="offering.semester.number", read_only=True)
    program_name = serializers.CharField(source="offering.semester.program.name", read_only=True)
    faculty_name = serializers.SerializerMethodField()
    day_name = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = TimetableSlot
        fields = [
            "id", "offering", "faculty", "day_of_week", "day_name", "period",
            "start_time", "end_time", "room", "building", "is_active",
            "course_code", "course_name", "section", "academic_year_name",
            "semester_number", "program_name", "faculty_name",
        ]

    def get_faculty_name(self, obj):
        profile = getattr(obj.faculty, "profile", None)
        if profile:
            return profile.full_name
        return obj.faculty.faculty_id

    def validate(self, attrs):
        offering = attrs.get("offering") or getattr(self.instance, "offering", None)
        faculty = attrs.get("faculty") or getattr(self.instance, "faculty", None)
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        period = attrs.get("period", getattr(self.instance, "period", None))
        if start and end and end <= start:
            raise serializers.ValidationError({"end_time": "End time must be later than start time."})
        if period is not None and not 1 <= period <= 12:
            raise serializers.ValidationError({"period": "Period must be between 1 and 12."})
        if offering:
            if not offering.is_active or offering.status in {"CLOSED", "CANCELLED"}:
                raise serializers.ValidationError({"offering": "Select an active and open course offering."})
            if faculty and not offering.faculty_assignments.filter(faculty=faculty, is_active=True).exists():
                raise serializers.ValidationError({"faculty": "Faculty is not assigned to this course offering."})
        return attrs
