from rest_framework import serializers

from .models import (
    AcademicYear,
    Course,
    Department,
    Program,
    Regulation,
    Semester,
    CourseOffering,
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
        start_year = attrs.get(
            "start_year",
            getattr(self.instance, "start_year", None),
        )
        end_year = attrs.get(
            "end_year",
            getattr(self.instance, "end_year", None),
        )

        if (
            end_year is not None
            and start_year is not None
            and end_year < start_year
        ):
            raise serializers.ValidationError({
                "end_year": (
                    "End year must be greater than or equal to start year."
                )
            })

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
        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )
        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if start_date is not None and end_date is not None:
            if start_date >= end_date:
                raise serializers.ValidationError({
                    "end_date": "End date must be after start date."
                })

        if attrs.get("is_current") is True:
            queryset = AcademicYear.objects.filter(is_current=True)
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError({
                    "is_current": (
                        "Another academic year is already marked current."
                    )
                })

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

    def validate(self, attrs):
        program = attrs.get("program", getattr(self.instance, "program", None))
        academic_year = attrs.get(
            "academic_year",
            getattr(self.instance, "academic_year", None),
        )
        number = attrs.get("number", getattr(self.instance, "number", None))
        semester_type = attrs.get(
            "semester_type",
            getattr(self.instance, "semester_type", None),
        )

        if program and not program.is_active:
            raise serializers.ValidationError({
                "program": "Semester must belong to an active program."
            })

        if program and academic_year and number:
            duplicate = Semester.objects.filter(
                program=program,
                academic_year=academic_year,
                number=number,
            )
            if self.instance is not None:
                duplicate = duplicate.exclude(pk=self.instance.pk)
            if duplicate.exists():
                raise serializers.ValidationError({
                    "number": (
                        "This semester already exists for the selected "
                        "program and academic year."
                    )
                })

        if number and semester_type:
            expected = (
                Semester.SemesterType.ODD
                if number % 2
                else Semester.SemesterType.EVEN
            )
            if semester_type != expected:
                raise serializers.ValidationError({
                    "semester_type": (
                        f"Semester {number} must be "
                        f"{expected.label}."
                    )
                })

        return attrs

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
            "lecture_hours",
            "tutorial_hours",
            "practical_hours",
            "course_category",
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

    def validate_lecture_hours(self, value):
        if value > 20:
            raise serializers.ValidationError(
                "Lecture hours must be between 0 and 20."
            )
        return value

    def validate_tutorial_hours(self, value):
        if value > 20:
            raise serializers.ValidationError(
                "Tutorial hours must be between 0 and 20."
            )
        return value

    def validate_practical_hours(self, value):
        if value > 30:
            raise serializers.ValidationError(
                "Practical hours must be between 0 and 30."
            )
        return value

    def validate(self, attrs):
        semester = attrs.get("semester", getattr(self.instance, "semester", None))
        regulation = attrs.get(
            "regulation",
            getattr(self.instance, "regulation", None),
        )

        if semester and regulation:
            if semester.program_id != regulation.program_id:
                raise serializers.ValidationError({
                    "regulation": (
                        "The selected regulation does not belong "
                        "to the selected semester's program."
                    )
                })

        if semester and not semester.is_active:
            raise serializers.ValidationError({
                "semester": "Course must belong to an active semester."
            })

        if regulation and not regulation.is_active:
            raise serializers.ValidationError({
                "regulation": "Course must use an active regulation."
            })

        return attrs

class CourseOfferingSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source="course.code", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )
    semester_number = serializers.IntegerField(
        source="semester.number",
        read_only=True,
    )
    program_name = serializers.CharField(
        source="semester.program.name",
        read_only=True,
    )

    class Meta:
        model = CourseOffering
        fields = [
            "id",
            "course",
            "course_code",
            "course_name",
            "academic_year",
            "academic_year_name",
            "semester",
            "semester_number",
            "program_name",
            "section",
            "capacity",
            "status",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "course_code",
            "course_name",
            "academic_year_name",
            "semester_number",
            "program_name",
            "created_at",
            "updated_at",
        ]

    def validate_capacity(self, value):
        if value < 1 or value > 1000:
            raise serializers.ValidationError(
                "Capacity must be between 1 and 1000."
            )
        return value

    def validate_section(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Section is required.")
        return value

    def validate(self, attrs):
        course = attrs.get("course", getattr(self.instance, "course", None))
        semester = attrs.get(
            "semester",
            getattr(self.instance, "semester", None),
        )
        academic_year = attrs.get(
            "academic_year",
            getattr(self.instance, "academic_year", None),
        )

        if course and semester and course.semester_id != semester.id:
            raise serializers.ValidationError({
                "semester": (
                    "The selected semester must match the course semester."
                )
            })

        if semester and academic_year:
            if semester.academic_year_id != academic_year.id:
                raise serializers.ValidationError({
                    "academic_year": (
                        "The selected academic year must match the semester."
                    )
                })

        if course and not course.is_active:
            raise serializers.ValidationError({
                "course": "Course offering must use an active course."
            })

        if semester and not semester.is_active:
            raise serializers.ValidationError({
                "semester": "Course offering must use an active semester."
            })

        return attrs
