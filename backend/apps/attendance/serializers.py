from rest_framework import serializers
from apps.students.models import Student
from apps.academics.models import CourseOffering


from .models import AttendanceRecord, AttendanceSession


class AttendanceSessionSerializer(serializers.ModelSerializer):
    offering = serializers.PrimaryKeyRelatedField(
        queryset=CourseOffering.objects.select_related(
            "course",
            "academic_year",
            "semester",
        ),
        required=True,
    )

    offering_course_code = serializers.CharField(
        source="offering.course.code",
        read_only=True,
    )

    offering_course_name = serializers.CharField(
        source="offering.course.name",
        read_only=True,
    )

    offering_section = serializers.CharField(
        source="offering.section",
        read_only=True,
    )

    faculty_employee_id = serializers.CharField(
        source="faculty.employee_id",
        read_only=True,
    )
    faculty_name = serializers.SerializerMethodField()

    course_code = serializers.CharField(
        source="course.code",
        read_only=True,
    )
    course_name = serializers.CharField(
        source="course.name",
        read_only=True,
    )

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )
    semester_number = serializers.IntegerField(
        source="semester.number",
        read_only=True,
    )
    record_count = serializers.IntegerField(
        source="records.count",
        read_only=True,
    )

    class Meta:
        model = AttendanceSession

        fields = (
            "id",
            "faculty",
            "offering",
            "offering_course_code",
            "offering_course_name",
            "offering_section",
            "faculty_employee_id",
            "offering_course_code",
            "offering_course_name",
            "offering_section",
            "faculty_name",
            "course",
            "course_code",
            "course_name",
            "academic_year",
            "academic_year_name",
            "semester",
            "semester_number",
            "session_date",
            "period",
            "topic",
            "remarks",
            "record_count",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "faculty_employee_id",
            "faculty_name",
            "course_code",
            "course_name",
            "academic_year_name",
            "semester_number",
            "record_count",
            "created_at",
            "updated_at",
        )

    def get_faculty_name(self, obj):
        return (
            obj.faculty.user.get_full_name()
            or obj.faculty.user.username
        )

    def validate(self, attrs):
        faculty = attrs.get("faculty")
        course = attrs.get("course")
        academic_year = attrs.get("academic_year")
        semester = attrs.get("semester")

        instance = self.instance

        if faculty is None and instance:
            faculty = instance.faculty

        if course is None and instance:
            course = instance.course

        if academic_year is None and instance:
            academic_year = instance.academic_year

        if semester is None and instance:
            semester = instance.semester

        errors = {}

        offering = attrs.get("offering")
        if offering is None and instance:
            offering = instance.offering
        if offering is None:
            errors["offering"] = "A course offering is required."
        elif offering.course_id != course.id:
            errors["offering"] = "The course offering does not match the selected course."
        elif offering.academic_year_id != academic_year.id:
            errors["offering"] = "The course offering does not match the selected academic year."
        elif offering.semester_id != semester.id:
            errors["offering"] = "The course offering does not match the selected semester."
        elif not offering.faculty_assignments.filter(faculty_id=faculty.id, is_active=True).exists():
            errors["faculty"] = "The faculty member is not assigned to this course offering."

        # -------------------------------------------------
        # Faculty validation
        # -------------------------------------------------
        if (
            faculty
            and faculty.status != faculty.Status.ACTIVE
            ):
            errors["faculty"] = (
        "The selected faculty member is not active."
    )
        # -------------------------------------------------
        # Course validation
        # -------------------------------------------------
        if course and not course.is_active:
            errors["course"] = (
                "The selected course is inactive."
            )

        # -------------------------------------------------
        # Semester validation
        # -------------------------------------------------
        if semester and not semester.is_active:
            errors["semester"] = (
                "The selected semester is inactive."
            )

        # -------------------------------------------------
        # Course ↔ Semester validation
        # -------------------------------------------------
        if (
            course
            and semester
            and course.semester_id != semester.id
        ):
            errors["semester"] = (
                "The selected semester does not match "
                "the course semester."
            )

        # -------------------------------------------------
        # Semester ↔ Academic Year validation
        # -------------------------------------------------
        if (
            semester
            and academic_year
            and semester.academic_year_id != academic_year.id
        ):
            errors["academic_year"] = (
                "The selected academic year does not "
                "match the semester."
            )

        # -------------------------------------------------
        # Faculty ↔ Course Assignment validation
        # -------------------------------------------------
        if (
            faculty
            and course
            and academic_year
            and semester
        ):
            assigned = (
                faculty.course_assignments.filter(
                    course=course,
                    academic_year=academic_year,
                    semester=semester,
                ).exists()
            )

            if not assigned:
                errors["faculty"] = (
                    "The faculty member is not assigned "
                    "to this course for the selected "
                    "academic year and semester."
                )

        # -------------------------------------------------
        # Faculty ownership validation
        # -------------------------------------------------
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if (
            user
            and user.is_authenticated
            and not user.is_superuser
        ):
            profile = getattr(
                user,
                "profile",
                None,
            )

            if (
                profile
                and profile.user_type == "FACULTY"
            ):
                current_faculty = getattr(
                    user,
                    "faculty",
                    None,
                )

                if not current_faculty:
                    errors["faculty"] = (
                        "Your account is not linked "
                        "to a faculty profile."
                    )

                elif (
                    faculty
                    and faculty.id != current_faculty.id
                ):
                    errors["faculty"] = (
                        "Faculty users can create "
                        "attendance sessions only "
                        "for themselves."
                    )

        # -------------------------------------------------
        # Session date validation
        # -------------------------------------------------
        session_date = attrs.get("session_date")

        if session_date is None and instance:
            session_date = instance.session_date

        if session_date and academic_year:
            if not (
                academic_year.start_date
                <= session_date
                <= academic_year.end_date
            ):
                errors["session_date"] = (
                    "The session date must fall within "
                    "the selected academic year."
                )

        # -------------------------------------------------
        # Period validation
        # -------------------------------------------------
        period = attrs.get("period")

        if period is None and instance:
            period = instance.period

        if period is not None and period < 1:
            errors["period"] = (
                "Period must be greater than or equal to 1."
            )

        if errors:
            raise serializers.ValidationError(errors)

        return attrs


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    student_id = serializers.CharField(
        source="student.student_id",
        read_only=True,
    )

    class Meta:
        model = AttendanceRecord

        fields = (
            "id",
            "session",
            "student",
            "student_id",
            "student_name",
            "status",
            "marked_at",
            "remarks",
        )

        read_only_fields = (
            "id",
            "student_id",
            "student_name",
            "marked_at",
        )

    def get_student_name(self, obj):
        return (
            obj.student.user.get_full_name()
            or obj.student.user.username
        )

    def validate(self, attrs):
        session = attrs.get("session")
        student = attrs.get("student")

        instance = self.instance

        if session is None and instance:
            session = instance.session

        if student is None and instance:
            student = instance.student

        errors = {}

        # -------------------------------------------------
        # Faculty ownership validation
        # -------------------------------------------------
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if (
            user
            and user.is_authenticated
            and not user.is_superuser
        ):
            profile = getattr(
                user,
                "profile",
                None,
            )

            if (
                profile
                and profile.user_type == "FACULTY"
                and session
            ):
                current_faculty = getattr(
                    user,
                    "faculty",
                    None,
                )

                if not current_faculty:
                    errors["session"] = (
                        "Your account is not linked "
                        "to a faculty profile."
                    )

                elif (
                    session.faculty_id
                    != current_faculty.id
                ):
                    errors["session"] = (
                        "Faculty users can modify "
                        "attendance only for their "
                        "own sessions."
                    )

        # -------------------------------------------------
        # Student enrollment validation
        # -------------------------------------------------
        if session and student:
            enrolled = student.enrollments.filter(
                semester_id=session.semester_id,
                academic_year_id=session.academic_year_id,
                status="ACTIVE",
            ).exists()

            if not enrolled:
                errors["student"] = (
                    "The student does not have an "
                    "active enrollment in the selected "
                    "semester and academic year."
                )

        if errors:
            raise serializers.ValidationError(errors)

        return attrs
class EnrolledStudentSerializer(
    serializers.ModelSerializer
):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = (
            "id",
            "student_id",
            "student_name",
            "program",
        )

    def get_student_name(self, obj):
        return (
            obj.user.get_full_name()
            or obj.user.username
        )