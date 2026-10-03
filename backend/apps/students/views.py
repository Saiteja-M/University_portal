from django.db import transaction
from django.db.models import Prefetch
from django.http import FileResponse
from django.utils import timezone
from apps.academics.models import Course


from rest_framework import viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response

from apps.students.services.student_pdf import (
    generate_student_profile_pdf,
)

from .models import (
    Enrollment,
    Guardian,
    Student,
    StudentProfile,
)

from .permissions import (
    IsAuthenticatedStudent,
    IsStudentManager,
    IsStudentViewer,
)

from .serializers import (
    EnrollmentSerializer,
    GuardianSerializer,
    StudentCourseSerializer,
    StudentProfileSerializer,
    StudentSerializer,
)

from .services import (
    create_enrollment,
    create_guardian,
    create_student,
    create_student_profile,
    permanently_delete_student,
    update_enrollment,
    update_guardian,
    update_student,
    update_student_profile,
)


class StudentsViewSetMixin:
    def get_permissions(self):
        """
        Permission policy for student endpoints.

        General student read endpoints:
            ADMIN / HOD / FACULTY

        Student self-service endpoint:
            /students/me/
            authenticated active STUDENT only

        Write operations:
            ADMIN / HOD
        """

        # The authenticated student's own record.
        #
        # This must be checked before the generic SAFE_METHODS
        # rule because STUDENT is intentionally NOT a general
        # student-information viewer.
        if getattr(self, "action", None) in {
    "me",
    "me_profile",
    "me_courses",
}:
            return [IsAuthenticatedStudent()]

        # Normal read-only student-management endpoints.
        if self.request.method in SAFE_METHODS:
            return [IsStudentViewer()]

        # Create/update/delete student-management endpoints.
        return [IsStudentManager()]

class StudentViewSet(
    StudentsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = (
        Student.objects
        .select_related(
            "user",
            "program",
            "program__department",
        )
        .prefetch_related(
            "profile",
            "guardians",
            Prefetch(
                "enrollments",
                queryset=(
                    Enrollment.objects
                    .filter(
                        status=Enrollment.Status.ACTIVE,
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
                ),
                to_attr="_current_enrollments",
            ),
        )
    )

    serializer_class = StudentSerializer

    parser_classes = [
        JSONParser,
        MultiPartParser,
        FormParser,
    ]

    search_fields = [
        "student_id",
        "admission_number",
        "user__username",
        "user__first_name",
        "user__last_name",
        "user__email",
        "program__name",
    ]

    ordering_fields = [
        "student_id",
        "admission_number",
        "admission_date",
        "created_at",
    ]

    ordering = ["student_id"]

    filterset_fields = [
        "program",
        "status",
    ]

    @action(
        detail=False,
        methods=["get"],
        url_path="me",
    )
    def me(self, request):
        """
        Return the authenticated student's own record.

        The student is resolved from request.user.student.
        No student ID is accepted from the client.
        """

        student = (
            Student.objects
            .select_related(
                "user",
                "program",
                "program__department",
            )
            .prefetch_related(
                "profile",
                "guardians",
                Prefetch(
                    "enrollments",
                    queryset=(
                        Enrollment.objects
                        .filter(
                            status=Enrollment.Status.ACTIVE,
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
                    ),
                    to_attr="_current_enrollments",
                ),
            )
            .get(
                pk=request.user.student.pk,
            )
        )

        serializer = self.get_serializer(student)

        return Response(serializer.data)

    @action(
        detail=True,
        methods=["get"],
        url_path="profile-pdf",
    )
    def profile_pdf(self, request, pk=None):
        """
        Download the student's profile as a PDF.

        Only administrators and HODs can download
        official student profile PDFs.
        """

        student = self.get_object()

        if request.user.is_superuser:
            allowed = True
        else:
            allowed = request.user.groups.filter(
                name__in={"ADMIN", "HOD"},
            ).exists()

        if not allowed:
            return Response(
                {
                    "detail": (
                        "You are not authorized "
                        "to download student profiles."
                    )
                },
                status=403,
            )

        pdf_buffer = generate_student_profile_pdf(
            student,
        )

        filename = (
            f"{student.student_id}_student_profile.pdf"
        )

        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=filename,
            content_type="application/pdf",
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="deactivate-account",
    )
    def deactivate_account(self, request, pk=None):
        """
        Deactivate a student's portal account.

        This does NOT delete the official Student record
        or academic history.
        """

        student = self.get_object()

        if request.user.is_superuser:
            allowed = True
        else:
            allowed = request.user.groups.filter(
                name="ADMIN",
            ).exists()

        if not allowed:
            return Response(
                {
                    "detail": (
                        "Only administrators can "
                        "deactivate student accounts."
                    )
                },
                status=403,
            )

        if student.user is None:
            return Response(
                {
                    "detail": (
                        "This student has not registered "
                        "for the student portal."
                    )
                },
                status=400,
            )

        if not student.user.is_active:
            return Response(
                {
                    "detail": (
                        "Student portal account is "
                        "already inactive."
                    )
                },
                status=400,
            )

        student.user.is_active = False

        student.user.save(
            update_fields=["is_active"],
        )

        Token.objects.filter(
            user=student.user,
        ).delete()

        return Response(
            {
                "detail": (
                    "Student portal account has "
                    "been deactivated."
                ),
                "student_id": student.student_id,
                "account_active": False,
            }
        )
    @action(
        detail=True,
        methods=["delete"],
        url_path="permanent-delete",
    )
    def permanent_delete(self, request, pk=None):
        if not request.user.is_superuser:
            if not request.user.groups.filter(name="ADMIN").exists():
                return Response(
                    {
                        "detail": (
                            "Only administrators can permanently delete "
                            "student records."
                        )
                    },
                    status=403,
                )

        student = self.get_object()
        student_id = student.student_id

        permanently_delete_student(student)

        return Response(status=204)
    @action(
        detail=False,
        methods=["get"],
        url_path="me/courses",
    )
    def me_courses(self, request):
        """
        Return courses belonging to the authenticated student's
        current active enrollment.

        The student identity is always resolved from the authenticated
        account. No student ID is accepted from the client.
        """

        student = (
            Student.objects
            .select_related(
                "program",
                "program__department",
            )
            .get(
                pk=request.user.student.pk,
            )
        )

        enrollment = (
            Enrollment.objects
            .filter(
                student=student,
                status=Enrollment.Status.ACTIVE,
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

        if enrollment is None:
            return Response(
                {
                    "student_id": student.student_id,
                    "academic_year": None,
                    "academic_year_name": None,
                    "semester": None,
                    "semester_number": None,
                    "semester_type": None,
                    "course_count": 0,
                    "total_credits": 0,
                    "results": [],
                }
            )

        courses = (
            Course.objects
            .filter(
                semester=enrollment.semester,
                is_active=True,
            )
            .select_related(
                "semester",
                "semester__program",
                "semester__academic_year",
                "regulation",
            )
            .order_by(
                "code",
            )
        )

        serializer = StudentCourseSerializer(
            courses,
            many=True,
        )

        total_credits = sum(
            course.credits or 0
            for course in courses
        )

        return Response(
            {
                "student_id": student.student_id,
                "academic_year": enrollment.academic_year_id,
                "academic_year_name": enrollment.academic_year.name,
                "semester": enrollment.semester_id,
                "semester_number": enrollment.semester.number,
                "semester_type": enrollment.semester.semester_type,
                "course_count": courses.count(),
                "total_credits": total_credits,
                "results": serializer.data,
            }
        )

    @transaction.atomic
    def perform_create(self, serializer):
        """
        Create the official Student record.

        Profile and initial enrollment information are
        supplied through serializer write-only fields.
        """

        validated_data = serializer.validated_data

        # ---------------------------------------------------------
        # Initial enrollment
        # ---------------------------------------------------------

        enrollment_academic_year = validated_data.pop(
            "enrollment_academic_year",
            None,
        )

        enrollment_semester = validated_data.pop(
            "enrollment_semester",
            None,
        )

        enrollment_date = validated_data.pop(
            "enrollment_date",
            None,
        )

        enrollment_status = validated_data.pop(
            "enrollment_status",
            Enrollment.Status.ACTIVE,
        )

        # ---------------------------------------------------------
        # Student profile
        # ---------------------------------------------------------

        date_of_birth = validated_data.pop(
            "create_date_of_birth",
            None,
        )

        gender = validated_data.pop(
            "create_gender",
            None,
        )

        blood_group = validated_data.pop(
            "create_blood_group",
            "",
        )

        phone_number = validated_data.pop(
            "create_phone_number",
            "",
        )

        institutional_email = validated_data.pop(
            "create_institutional_email",
            "",
        )

        alternate_phone_number = validated_data.pop(
            "create_alternate_phone_number",
            "",
        )

        address = validated_data.pop(
            "create_address",
            "",
        )

        city = validated_data.pop(
            "create_city",
            "",
        )

        state = validated_data.pop(
            "create_state",
            "",
        )

        postal_code = validated_data.pop(
            "create_postal_code",
            "",
        )

        # ---------------------------------------------------------
        # Create Student
        # ---------------------------------------------------------

        student = create_student(
            student_id=validated_data["student_id"],
            admission_number=validated_data[
                "admission_number"
            ],
            program=validated_data["program"],
            admission_date=validated_data[
                "admission_date"
            ],
            status=validated_data.get(
                "status",
                Student.Status.ACTIVE,
            ),
            date_of_birth=date_of_birth,
            gender=gender,
            blood_group=blood_group,
            phone_number=phone_number,
            institutional_email=institutional_email,
            alternate_phone_number=(
                alternate_phone_number
            ),
            address=address,
            city=city,
            state=state,
            postal_code=postal_code,
        )

        # ---------------------------------------------------------
        # Initial enrollment
        # ---------------------------------------------------------

        if enrollment_academic_year is not None:
            Enrollment.objects.create(
                student=student,
                academic_year=enrollment_academic_year,
                semester=enrollment_semester,
                enrollment_date=(
                    enrollment_date
                    or timezone.localdate()
                ),
                status=enrollment_status,
            )

        serializer.instance = student

    def perform_update(self, serializer):
        """
        Update the official Student record through
        the service layer.
        """

        student = update_student(
            serializer.instance,
            **serializer.validated_data,
        )

        serializer.instance = student
    

class StudentProfileViewSet(
    StudentsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = (
        StudentProfile.objects
        .select_related(
            "student",
            "student__user",
        )
        .all()
    )

    serializer_class = StudentProfileSerializer

    parser_classes = [
        JSONParser,
        MultiPartParser,
        FormParser,
    ]

    search_fields = [
        "student__student_id",
        "student__user__first_name",
        "student__user__last_name",
        "phone_number",
        "institutional_email",
        "city",
        "state",
    ]

    ordering_fields = [
        "date_of_birth",
        "created_at",
    ]

    ordering = ["student__student_id"]

    filterset_fields = [
        "gender",
        "blood_group",
    ]

    def perform_create(self, serializer):
        profile = create_student_profile(
            **serializer.validated_data,
        )

        serializer.instance = profile

    def perform_update(self, serializer):
        profile = update_student_profile(
            serializer.instance,
            **serializer.validated_data,
        )

        serializer.instance = profile


class GuardianViewSet(
    StudentsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = (
        Guardian.objects
        .select_related(
            "student",
            "student__user",
        )
        .all()
    )

    serializer_class = GuardianSerializer

    search_fields = [
        "name",
        "phone_number",
        "email",
        "occupation",
        "student__student_id",
    ]

    ordering_fields = [
        "name",
        "created_at",
    ]

    ordering = ["name"]

    filterset_fields = [
        "relationship",
    ]

    def perform_create(self, serializer):
        guardian = create_guardian(
            **serializer.validated_data,
        )

        serializer.instance = guardian

    def perform_update(self, serializer):
        guardian = update_guardian(
            serializer.instance,
            **serializer.validated_data,
        )

        serializer.instance = guardian


class EnrollmentViewSet(
    StudentsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = (
        Enrollment.objects
        .select_related(
            "student",
            "student__user",
            "student__program",
            "academic_year",
            "semester",
            "semester__program",
        )
        .all()
    )

    serializer_class = EnrollmentSerializer

    search_fields = [
        "student__student_id",
        "student__user__first_name",
        "student__user__last_name",
        "academic_year__name",
    ]

    ordering_fields = [
        "enrollment_date",
        "created_at",
    ]

    ordering = ["-enrollment_date"]

    filterset_fields = [
        "student",
        "academic_year",
        "semester",
        "status",
    ]

    def perform_create(self, serializer):
        enrollment = create_enrollment(
            **serializer.validated_data,
        )

        serializer.instance = enrollment

    def perform_update(self, serializer):
        enrollment = update_enrollment(
            serializer.instance,
            **serializer.validated_data,
        )

        serializer.instance = enrollment