from django.utils import timezone
from rest_framework import serializers
from apps.academics.models import Course

from apps.academics.models import AcademicYear, Semester

from .models import CourseOfferingEnrollment, Enrollment, Guardian, Student, StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        request = self.context.get("request")
        student = getattr(request.user, "student", None) if request else None
        if student is not None:
            supplied_student = attrs.get("student")
            if supplied_student is not None and supplied_student.pk != student.pk:
                raise serializers.ValidationError({"student": "You can only manage your own student profile."})
            attrs["student"] = student
        return attrs


    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "student",
            "date_of_birth",
            "gender",
            "blood_group",
            "phone_number",
            "institutional_email",
            "alternate_phone_number",
            "address",
            "city",
            "state",
            "postal_code",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_phone_number(self, value):
        value = value.strip()

        if len(value) < 7:
            raise serializers.ValidationError(
                "Phone number must contain at least 7 characters."
            )

        return value

    def validate_institutional_email(self, value):
        return value.strip().lower()


class GuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = [
            "id",
            "student",
            "name",
            "relationship",
            "phone_number",
            "email",
            "occupation",
            "address",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_phone_number(self, value):
        value = value.strip()

        if len(value) < 7:
            raise serializers.ValidationError(
                "Phone number must contain at least 7 characters."
            )

        return value


class StudentSerializer(serializers.ModelSerializer):
    # ------------------------------------------------------------------
    # User information
    # ------------------------------------------------------------------

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    # ------------------------------------------------------------------
    # Student profile information
    # ------------------------------------------------------------------

    create_date_of_birth = serializers.DateField(
        write_only=True,
        required=True,
    )

    create_gender = serializers.ChoiceField(
        choices=StudentProfile.Gender.choices,
        write_only=True,
        required=True,
    )

    create_blood_group = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default="",
    )

    create_phone_number = serializers.CharField(
        write_only=True,
        required=True,
    )

    create_institutional_email = serializers.EmailField(
        write_only=True,
        required=True,
    )

    create_alternate_phone_number = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default="",
    )

    create_address = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default="",
    )

    create_city = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default="",
    )

    create_state = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default="",
    )

    create_postal_code = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default="",
    )

    # ------------------------------------------------------------------
    # Display fields
    # ------------------------------------------------------------------

    program_name = serializers.CharField(
        source="program.name",
        read_only=True,
    )

    department_name = serializers.CharField(
        source="program.department.name",
        read_only=True,
    )

    profile = StudentProfileSerializer(
        read_only=True,
    )

    guardians = GuardianSerializer(
        many=True,
        read_only=True,
    )

    # ------------------------------------------------------------------
    # Enrollment-derived fields
    # ------------------------------------------------------------------

    current_enrollment = serializers.SerializerMethodField()

    year_of_study = serializers.SerializerMethodField()

    semester = serializers.SerializerMethodField()

    academic_year = serializers.SerializerMethodField()

    # ------------------------------------------------------------------
    # Initial enrollment
    # ------------------------------------------------------------------

    enrollment_academic_year = serializers.PrimaryKeyRelatedField(
        queryset=AcademicYear.objects.all(),
        write_only=True,
        required=False,
    )

    enrollment_semester = serializers.PrimaryKeyRelatedField(
        queryset=Semester.objects.select_related(
            "program",
            "academic_year",
        ),
        write_only=True,
        required=False,
    )

    enrollment_date = serializers.DateField(
        write_only=True,
        required=False,
    )

    enrollment_status = serializers.ChoiceField(
        choices=Enrollment.Status.choices,
        write_only=True,
        required=False,
        default=Enrollment.Status.ACTIVE,
    )

    class Meta:
        model = Student

        fields = [
            # Student
            "id",
            "student_id",
            "admission_number",

            # User
            "user",
            "username",
            "first_name",
            "last_name",
            "email",

            # Academic
            "program",
            "program_name",
            "department_name",
            "admission_date",
            "status",

            # Current enrollment
            "current_enrollment",
            "academic_year",
            "semester",
            "year_of_study",

            # Student information
            "profile",
            "guardians",

            # Student profile creation
            "create_date_of_birth",
            "create_gender",
            "create_blood_group",
            "create_phone_number",
            "create_institutional_email",
            "create_alternate_phone_number",
            "create_address",
            "create_city",
            "create_state",
            "create_postal_code",

            # Initial enrollment
            "enrollment_academic_year",
            "enrollment_semester",
            "enrollment_date",
            "enrollment_status",

            # Timestamps
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "username",
            "first_name",
            "last_name",
            "email",
            "program_name",
            "department_name",
            "current_enrollment",
            "academic_year",
            "semester",
            "year_of_study",
            "profile",
            "guardians",
            "created_at",
            "updated_at",
        ]

    # ------------------------------------------------------------------
    # Basic validation
    # ------------------------------------------------------------------

    def validate_student_id(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Student ID cannot be empty."
            )

        return value

    def validate_admission_number(self, value):
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                "Admission number cannot be empty."
            )

        return value

    def validate_create_phone_number(self, value):
        value = value.strip()

        if len(value) < 7:
            raise serializers.ValidationError(
                "Phone number must contain at least 7 characters."
            )

        return value

    def validate_create_institutional_email(self, value):
        return value.strip().lower()

    def validate_create_alternate_phone_number(self, value):
        value = value.strip()

        if value and len(value) < 7:
            raise serializers.ValidationError(
                "Alternate phone number must contain at least 7 characters."
            )

        return value

    def validate_create_date_of_birth(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError(
                "Date of birth cannot be in the future."
            )

        return value

    # ------------------------------------------------------------------
    # Cross-field validation
    # ------------------------------------------------------------------

    def validate(self, attrs):
        admission_date = attrs.get("admission_date")

        if (
            admission_date
            and admission_date > timezone.localdate()
        ):
            raise serializers.ValidationError(
                {
                    "admission_date": (
                        "Admission date cannot be in the future."
                    )
                }
            )

        enrollment_academic_year = attrs.get(
            "enrollment_academic_year"
        )

        enrollment_semester = attrs.get(
            "enrollment_semester"
        )

        # Academic year and semester must be supplied together.
        if bool(enrollment_academic_year) != bool(
            enrollment_semester
        ):
            raise serializers.ValidationError(
                {
                    "enrollment": (
                        "Academic year and semester must "
                        "be provided together."
                    )
                }
            )

        if enrollment_semester:
            program = attrs.get("program")

            if (
                program
                and enrollment_semester.program_id
                != program.id
            ):
                raise serializers.ValidationError(
                    {
                        "enrollment_semester": (
                            "Selected semester does not belong "
                            "to the selected student program."
                        )
                    }
                )

            if (
                enrollment_academic_year
                and enrollment_semester.academic_year_id
                != enrollment_academic_year.id
            ):
                raise serializers.ValidationError(
                    {
                        "enrollment_academic_year": (
                            "Selected academic year does not "
                            "match the selected semester."
                        )
                    }
                )

        return attrs

    # ------------------------------------------------------------------
    # Current enrollment helpers
    # ------------------------------------------------------------------

    def _get_current_enrollment(self, obj):
        prefetched = getattr(
            obj,
            "_current_enrollments",
            None,
        )

        if prefetched is not None:
            return (
                prefetched[0]
                if prefetched
                else None
            )

        return (
            obj.enrollments
            .filter(
                status=Enrollment.Status.ACTIVE
            )
            .select_related(
                "academic_year",
                "semester",
                "semester__program",
            )
            .order_by(
                "-academic_year__start_date",
                "-semester__number",
            )
            .first()
        )

    def get_current_enrollment(
        self,
        obj,
    ) -> dict | None:
        enrollment = self._get_current_enrollment(obj)

        if not enrollment:
            return None

        return {
            "id": enrollment.id,
            "academic_year": enrollment.academic_year_id,
            "academic_year_name": enrollment.academic_year.name,
            "semester": enrollment.semester_id,
            "semester_number": enrollment.semester.number,
            "year_of_study": (
                enrollment.semester.number + 1
            ) // 2,
            "status": enrollment.status,
            "enrollment_date": enrollment.enrollment_date,
        }

    def get_year_of_study(
        self,
        obj,
    ) -> int | None:
        enrollment = self._get_current_enrollment(obj)

        if not enrollment:
            return None

        return (
            enrollment.semester.number + 1
        ) // 2

    def get_semester(
        self,
        obj,
    ) -> int | None:
        enrollment = self._get_current_enrollment(obj)

        if not enrollment:
            return None

        return enrollment.semester.number

    def get_academic_year(
        self,
        obj,
    ) -> str | None:
        enrollment = self._get_current_enrollment(obj)

        if not enrollment:
            return None

        return enrollment.academic_year.name


class EnrollmentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(
        source="student.student_id",
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

    program_name = serializers.CharField(
        source="semester.program.name",
        read_only=True,
    )

    year_of_study = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment

        fields = [
            "id",
            "student",
            "student_id",
            "academic_year",
            "academic_year_name",
            "semester",
            "semester_number",
            "year_of_study",
            "program_name",
            "status",
            "enrollment_date",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "student_id",
            "academic_year_name",
            "semester_number",
            "year_of_study",
            "program_name",
            "created_at",
            "updated_at",
        ]

    def get_year_of_study(
        self,
        obj,
    ) -> int:
        return (
            obj.semester.number + 1
        ) // 2

    def validate(self, attrs):
        student = attrs.get(
            "student",
            getattr(
                self.instance,
                "student",
                None,
            ),
        )

        semester = attrs.get(
            "semester",
            getattr(
                self.instance,
                "semester",
                None,
            ),
        )

        academic_year = attrs.get(
            "academic_year",
            getattr(
                self.instance,
                "academic_year",
                None,
            ),
        )

        status = attrs.get(
            "status",
            getattr(
                self.instance,
                "status",
                Enrollment.Status.ACTIVE,
            ),
        )

        enrollment_date = attrs.get(
            "enrollment_date",
            getattr(
                self.instance,
                "enrollment_date",
                None,
            ),
        )

        if not student:
            raise serializers.ValidationError(
                {
                    "student": (
                        "Student is required."
                    )
                }
            )

        if not semester:
            raise serializers.ValidationError(
                {
                    "semester": (
                        "Semester is required."
                    )
                }
            )

        if not academic_year:
            raise serializers.ValidationError(
                {
                    "academic_year": (
                        "Academic year is required."
                    )
                }
            )

        if semester.program_id != student.program_id:
            raise serializers.ValidationError(
                {
                    "semester": (
                        "Selected semester does not "
                        "belong to the student's program."
                    )
                }
            )

        if semester.academic_year_id != academic_year.id:
            raise serializers.ValidationError(
                {
                    "academic_year": (
                        "Selected academic year does not "
                        "match the selected semester."
                    )
                }
            )

        if not enrollment_date:
            raise serializers.ValidationError(
                {
                    "enrollment_date": (
                        "Enrollment date is required."
                    )
                }
            )

        if (
            enrollment_date < academic_year.start_date
            or enrollment_date > academic_year.end_date
        ):
            raise serializers.ValidationError(
                {
                    "enrollment_date": (
                        "Enrollment date must fall within "
                        "the selected academic year."
                    )
                }
            )

        if (
            student.admission_date
            and enrollment_date < student.admission_date
        ):
            raise serializers.ValidationError(
                {
                    "enrollment_date": (
                        "Enrollment date cannot be earlier "
                        "than the student's admission date."
                    )
                }
            )

        if status == Enrollment.Status.ACTIVE:
            existing_active = (
                Enrollment.objects.filter(
                    student=student,
                    status=Enrollment.Status.ACTIVE,
                )
            )

            if self.instance:
                existing_active = (
                    existing_active.exclude(
                        pk=self.instance.pk
                    )
                )

            if existing_active.exists():
                raise serializers.ValidationError(
                    {
                        "status": (
                            "This student already has an "
                            "active enrollment. Complete or "
                            "close the current enrollment "
                            "before creating another active "
                            "enrollment."
                        )
                    }
                )

        return attrs

class StudentCourseSerializer(serializers.ModelSerializer):
    """
    Read-only course representation for the authenticated student.

    Only courses belonging to the student's current active
    enrollment semester are exposed through the student portal.
    """

    semester_number = serializers.IntegerField(
        source="semester.number",
        read_only=True,
    )

    semester_type = serializers.CharField(
        source="semester.semester_type",
        read_only=True,
    )

    academic_year = serializers.IntegerField(
        source="semester.academic_year.id",
        read_only=True,
    )

    academic_year_name = serializers.CharField(
        source="semester.academic_year.name",
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
            "code",
            "name",
            "credits",
            "semester",
            "semester_number",
            "semester_type",
            "academic_year",
            "academic_year_name",
            "program_name",
            "regulation",
            "regulation_code",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields    

class CourseOfferingEnrollmentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source="student_enrollment.student.student_id", read_only=True)
    student_name = serializers.SerializerMethodField()
    course_code = serializers.CharField(source="offering.course.code", read_only=True)
    course_name = serializers.CharField(source="offering.course.name", read_only=True)
    academic_year_name = serializers.CharField(source="offering.academic_year.name", read_only=True)
    semester_number = serializers.IntegerField(source="offering.semester.number", read_only=True)
    program_name = serializers.CharField(source="offering.semester.program.name", read_only=True)
    section = serializers.CharField(source="offering.section", read_only=True)

    class Meta:
        model = CourseOfferingEnrollment
        fields = [
            "id", "student_enrollment", "student_id", "student_name", "offering",
            "course_code", "course_name", "academic_year_name", "semester_number",
            "program_name", "section", "status", "enrolled_date", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "student_id", "student_name", "course_code", "course_name",
            "academic_year_name", "semester_number", "program_name", "section",
            "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        user = obj.student_enrollment.student.user
        return user.get_full_name().strip() if user else obj.student_enrollment.student.student_id

    def validate(self, attrs):
        enrollment = attrs.get("student_enrollment", getattr(self.instance, "student_enrollment", None))
        offering = attrs.get("offering", getattr(self.instance, "offering", None))
        if not enrollment or not offering:
            raise serializers.ValidationError("Student enrollment and course offering are required.")
        if enrollment.status != Enrollment.Status.ACTIVE:
            raise serializers.ValidationError({"student_enrollment": "Only an active semester enrollment can receive course offerings."})
        if enrollment.academic_year_id != offering.academic_year_id:
            raise serializers.ValidationError({"offering": "Course offering academic year must match the student's enrollment."})
        if enrollment.semester_id != offering.semester_id:
            raise serializers.ValidationError({"offering": "Course offering semester must match the student's enrollment."})
        if enrollment.student.program_id != offering.semester.program_id:
            raise serializers.ValidationError({"offering": "Course offering must belong to the student's program."})
        if not offering.is_active or offering.status in {"CLOSED", "CANCELLED"}:
            raise serializers.ValidationError({"offering": "Only active open/planned course offerings can accept students."})

        if offering.status not in {"PLANNED", "OPEN"}:
            raise serializers.ValidationError({"offering": "Students can only be enrolled in planned or open course offerings."})

        status = attrs.get("status", getattr(self.instance, "status", CourseOfferingEnrollment.Status.ENROLLED))
        if status == CourseOfferingEnrollment.Status.ENROLLED:
            enrolled_count = (
                CourseOfferingEnrollment.objects
                .filter(
                    offering=offering,
                    status=CourseOfferingEnrollment.Status.ENROLLED,
                )
                .exclude(pk=self.instance.pk if self.instance else None)
                .count()
            )
            if enrolled_count >= offering.capacity:
                raise serializers.ValidationError(
                    {"offering": "Course offering capacity has been reached."}
                )

        return attrs
