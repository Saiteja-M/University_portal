from rest_framework import serializers

from .models import (
    AcademicYear,
    Course,
    Department,
    Program,
    Regulation,
    Semester,
)

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = [
            "id",
            "code",
            "name",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_code(self, value):
        return value.strip().upper()

    def validate_name(self, value):
        return value.strip()


class ProgramSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    class Meta:
        model = Program
        fields = [
            "id",
            "department",
            "department_name",
            "code",
            "name",
            "duration_years",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "department_name",
            "created_at",
            "updated_at",
        ]

    def validate_code(self, value):
        return value.strip().upper()

    def validate_name(self, value):
        return value.strip()

    def validate_duration_years(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError(
                "Duration must be between 1 and 10 years."
            )
        return value



class RegulationSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(
        source="program.name",
        read_only=True,
    )

    class Meta:
        model = Regulation
        fields = [
            "id",
            "program",
            "program_name",
            "code",
            "name",
            "start_year",
            "end_year",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "program_name",
            "created_at",
            "updated_at",
        ]

    def validate_code(self, value):
        return value.strip().upper()

    def validate_name(self, value):
        return value.strip()

    def validate(self, attrs):
        start_year = attrs.get("start_year")
        end_year = attrs.get("end_year")

        if (
            end_year is not None
            and start_year is not None
            and end_year < start_year
        ):
            raise serializers.ValidationError(
                "End year must be greater than or equal to start year."
            )

        return attrs
class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = [
            "id",
            "name",
            "start_date",
            "end_date",
            "is_current",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        if attrs["start_date"] >= attrs["end_date"]:
            raise serializers.ValidationError(
                "Start date must be before end date."
            )
        return attrs


class SemesterSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(
        source="program.name",
        read_only=True,
    )
    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    class Meta:
        model = Semester
        fields = [
            "id",
            "program",
            "program_name",
            "academic_year",
            "academic_year_name",
            "number",
            "semester_type",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "program_name",
            "academic_year_name",
            "created_at",
            "updated_at",
        ]

    def validate_number(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError(
                "Semester number must be between 1 and 12."
            )
        return value

class CourseSerializer(serializers.ModelSerializer):
    semester_number = serializers.IntegerField(
        source="semester.number",
        read_only=True,
    )

    program_name = serializers.CharField(
        source="semester.program.name",
        read_only=True,
    )

    regulation_code = serializers.CharField(
        source="regulation.code",
        read_only=True,
    )

    class Meta:
        model = Course
        fields = [
            "id",
            "semester",
            "semester_number",
            "program_name",
            "regulation",
            "regulation_code",
            "code",
            "name",
            "credits",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "semester_number",
            "program_name",
            "regulation_code",
            "created_at",
            "updated_at",
        ]

    def validate_code(self, value):
        return value.strip().upper()

    def validate_name(self, value):
        return value.strip()

    def validate_credits(self, value):
        if value < 0 or value > 30:
            raise serializers.ValidationError(
                "Credits must be between 0 and 30."
            )

        return value

    def validate(self, attrs):
        semester = attrs.get("semester")
        regulation = attrs.get("regulation")

        if semester and regulation:
            if semester.program_id != regulation.program_id:
                raise serializers.ValidationError({
                    "regulation": (
                        "The selected regulation does not belong "
                        "to the selected semester's program."
                    )
                })

        return attrs