from drf_spectacular.utils import (
    OpenApiResponse,
    extend_schema,
)
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import AcademicYear, Program

from .serializers import (
    StudentPasswordResetConfirmSerializer,
    StudentPasswordResetRequestSerializer,
    StudentRegistrationCompleteSerializer,
    StudentRegistrationVerifySerializer,
    FacultyPasswordResetRequestSerializer,
    FacultyPasswordResetConfirmSerializer,
)
from .services import (
    complete_student_password_reset,
    complete_student_registration,
    start_student_password_reset,
    start_student_registration,
    complete_faculty_password_reset,
    start_faculty_password_reset,
)


class StudentRegistrationOptionsView(APIView):
    """
    Public endpoint used by the student registration page.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        responses={
            200: OpenApiResponse(
                description="Available student registration options.",
            ),
        },
    )
    def get(self, request):
        programs = (
            Program.objects
            .all()
            .order_by("name")
        )

        academic_years = (
            AcademicYear.objects
            .all()
            .order_by("-start_date")
        )

        return Response({
            "study_years": [
                {
                    "id": year,
                    "name": f"Year {year}",
                }
                for year in range(1, 5)
            ],
            "programs": [
                {
                    "id": program.id,
                    "name": program.name,
                }
                for program in programs
            ],
            "academic_years": [
                {
                    "id": academic_year.id,
                    "name": academic_year.name,
                }
                for academic_year in academic_years
            ],
        })


class StudentRegistrationVerifyView(APIView):
    """
    Verify student identity information and issue an OTP.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=StudentRegistrationVerifySerializer,
        responses={
            200: OpenApiResponse(
                description="OTP sent successfully.",
            ),
            400: OpenApiResponse(
                description="Student registration details could not be verified.",
            ),
        },
    )
    def post(self, request):
        serializer = StudentRegistrationVerifySerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            result = start_student_registration(
                **serializer.validated_data,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": (
                    "Verification code sent to "
                    "your registered email."
                ),
                "registration_token": result["registration_token"],
                "student_id": result["student_id"],
                "expires_at": result["expires_at"],
                "otp_expires_at": result["otp_expires_at"],
            },
            status=status.HTTP_200_OK,
        )


class StudentRegistrationCompleteView(APIView):
    """
    Verify the registration OTP and activate the
    student's portal account.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=StudentRegistrationCompleteSerializer,
        responses={
            200: OpenApiResponse(
                description="Student registration completed.",
            ),
            400: OpenApiResponse(
                description="Invalid OTP or registration token.",
            ),
        },
    )
    def post(self, request):
        serializer = StudentRegistrationCompleteSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            student = complete_student_registration(
                **serializer.validated_data,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": (
                    "Student portal registration "
                    "completed successfully."
                ),
                "student_id": student.student_id,
            },
            status=status.HTTP_200_OK,
        )


class StudentPasswordResetRequestView(APIView):
    """
    Start the student password-reset process.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=StudentPasswordResetRequestSerializer,
        responses={
            200: OpenApiResponse(
                description="Password-reset OTP sent.",
            ),
            400: OpenApiResponse(
                description="Invalid password-reset request.",
            ),
        },
    )
    def post(self, request):
        serializer = StudentPasswordResetRequestSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            result = start_student_password_reset(
                **serializer.validated_data,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": (
                    "Password-reset verification code "
                    "sent to your registered destination."
                ),
                "reset_token": result["reset_token"],
                "student_id": result["student_id"],
                "expires_at": result["expires_at"],
                "otp_expires_at": result["otp_expires_at"],
            },
            status=status.HTTP_200_OK,
        )


class StudentPasswordResetConfirmView(APIView):
    """
    Verify the password-reset OTP and set the new password.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=StudentPasswordResetConfirmSerializer,
        responses={
            200: OpenApiResponse(
                description="Password reset completed.",
            ),
            400: OpenApiResponse(
                description="Invalid OTP or reset token.",
            ),
        },
    )
    def post(self, request):
        serializer = StudentPasswordResetConfirmSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            student = complete_student_password_reset(
                **serializer.validated_data,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": (
                    "Student password has been "
                    "reset successfully."
                ),
                "student_id": student.student_id,
            },
            status=status.HTTP_200_OK,
        )
class FacultyPasswordResetRequestView(APIView):
    """
    Start the faculty password-reset process.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=FacultyPasswordResetRequestSerializer,
        responses={
            200: OpenApiResponse(
                description="Faculty password-reset OTP sent.",
            ),
            400: OpenApiResponse(
                description="Invalid faculty password-reset request.",
            ),
        },
    )
    def post(self, request):
        serializer = (
            FacultyPasswordResetRequestSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            result = start_faculty_password_reset(
                **serializer.validated_data,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": (
                    "Password-reset verification code "
                    "sent to your registered faculty email."
                ),
                "reset_token": result["reset_token"],
                "faculty_id": result["faculty_id"],
                "faculty_code": result["faculty_code"],
                "expires_at": result["expires_at"],
                "otp_expires_at": result[
                    "otp_expires_at"
                ],
            },
            status=status.HTTP_200_OK,
        )


class FacultyPasswordResetConfirmView(APIView):
    """
    Verify the faculty password-reset OTP
    and set the new password.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=FacultyPasswordResetConfirmSerializer,
        responses={
            200: OpenApiResponse(
                description="Faculty password reset completed.",
            ),
            400: OpenApiResponse(
                description="Invalid OTP or reset token.",
            ),
        },
    )
    def post(self, request):
        serializer = (
            FacultyPasswordResetConfirmSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            faculty = (
                complete_faculty_password_reset(
                    **serializer.validated_data,
                )
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": (
                    "Faculty password has been "
                    "reset successfully."
                ),
                "faculty_id": faculty.id,
                "faculty_code": faculty.faculty_id,
            },
            status=status.HTTP_200_OK,
        )    