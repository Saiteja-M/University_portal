from datetime import date
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.academics.models import AcademicYear, Department, Program, Semester
from apps.accounts.models import OTPRecord, UserProfile
from apps.students.models import Enrollment, Student, StudentProfile


class StudentPasswordResetTests(APITestCase):

    def setUp(self):
        self.department = Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )

        self.program = Program.objects.create(
            department=self.department,
            code="BTECH-CSE",
            name="Bachelor of Technology in Computer Science and Engineering",
            duration_years=4,
        )

        self.academic_year = AcademicYear.objects.create(
            name="2026-27",
            start_date=date(2026, 6, 1),
            end_date=date(2027, 5, 31),
            is_current=True,
        )

        self.semester = Semester.objects.create(
            program=self.program,
            academic_year=self.academic_year,
            number=3,
            semester_type=Semester.SemesterType.ODD,
        )

        self.user = User.objects.create_user(
            username="reset_student",
            email="reset@example.com",
            password="OldPassword123!",
        )

        self.student = Student.objects.create(
            user=self.user,
            student_id="STU-RESET-001",
            admission_number="ADM-RESET-001",
            program=self.program,
            admission_date=date(2026, 6, 10),
            status=Student.Status.ACTIVE,
        )

        StudentProfile.objects.create(
            student=self.student,
            date_of_birth=date(2005, 5, 15),
            gender=StudentProfile.Gender.MALE,
            blood_group="O+",
            phone_number="9876543210",
            city="Wanaparthy",
            state="Telangana",
            postal_code="509103",
        )

        Enrollment.objects.create(
            student=self.student,
            academic_year=self.academic_year,
            semester=self.semester,
            status=Enrollment.Status.ACTIVE,
            enrollment_date=date(2026, 6, 15),
        )

        UserProfile.objects.create(
            user=self.user,
            user_type=UserProfile.UserType.STUDENT,
            employee_or_student_id=self.student.student_id,
            phone_number="9876543210",
            is_student_registered=True,
        )

    def request_reset(self):
        return self.client.post(
            "/api/v1/auth/student/password-reset/request/",
            {
                "student_id": self.student.student_id,
                "channel": "EMAIL",
            },
            format="json",
        )

    def test_password_reset_request_sends_otp(self):
        response = self.request_reset()

        self.assertEqual(response.status_code, 200)
        self.assertIn("reset_token", response.data)
        self.assertIn("student_id", response.data)
        self.assertEqual(len(mail.outbox), 1)

        record = OTPRecord.objects.get(
            student=self.student,
            purpose=OTPRecord.Purpose.PASSWORD_RESET,
        )

        self.assertEqual(
            record.channel,
            OTPRecord.Channel.EMAIL,
        )

        self.assertTrue(record.otp_hash)
        self.assertTrue(record.challenge_token_hash)

    def test_password_reset_rejects_unknown_student(self):
        response = self.client.post(
            "/api/v1/auth/student/password-reset/request/",
            {
                "student_id": "DOES-NOT-EXIST",
                "channel": "EMAIL",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_password_reset_rejects_invalid_channel(self):
        response = self.client.post(
            "/api/v1/auth/student/password-reset/request/",
            {
                "student_id": self.student.student_id,
                "channel": "WHATSAPP",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_password_reset_rejects_wrong_otp(self):
        response = self.request_reset()

        reset_token = response.data["reset_token"]

        response = self.client.post(
            "/api/v1/auth/student/password-reset/confirm/",
            {
                "reset_token": reset_token,
                "otp": "000000",
                "password": "NewPassword123!",
                "password_confirm": "NewPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertTrue(
            self.user.check_password("OldPassword123!")
        )

    def test_password_reset_rejects_password_mismatch(self):
        response = self.request_reset()

        reset_token = response.data["reset_token"]

        response = self.client.post(
            "/api/v1/auth/student/password-reset/confirm/",
            {
                "reset_token": reset_token,
                "otp": "123456",
                "password": "NewPassword123!",
                "password_confirm": "DifferentPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_password_reset_rejects_weak_password(self):
        response = self.request_reset()

        reset_token = response.data["reset_token"]

        response = self.client.post(
            "/api/v1/auth/student/password-reset/confirm/",
            {
                "reset_token": reset_token,
                "otp": "123456",
                "password": "123",
                "password_confirm": "123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
def test_password_reset_successfully_changes_password(self):
    with patch(
        "apps.accounts.otp.generate_otp",
        return_value="123456",
    ):
        response = self.request_reset()

    self.assertEqual(response.status_code, 200)

    reset_token = response.data["reset_token"]

    response = self.client.post(
        "/api/v1/auth/student/password-reset/confirm/",
        {
            "reset_token": reset_token,
            "otp": "123456",
            "password": "NewPassword123!",
            "password_confirm": "NewPassword123!",
        },
        format="json",
    )

    self.assertEqual(response.status_code, 200)

    self.user.refresh_from_db()

    self.assertTrue(
        self.user.check_password(
            "NewPassword123!",
        )
    )

    self.assertFalse(
        self.user.check_password(
            "OldPassword123!",
        )
    )

    record = OTPRecord.objects.get(
        student=self.student,
        purpose=OTPRecord.Purpose.PASSWORD_RESET,
    )

    self.assertIsNotNone(
        record.used_at,
    )

    def test_password_reset_invalidates_existing_tokens(self):
        token = Token.objects.create(
            user=self.user,
        )

        response = self.request_reset()

        reset_token = response.data["reset_token"]

        with patch(
            "apps.accounts.services.verify_otp",
            return_value=(True, None),
        ):
            response = self.client.post(
                "/api/v1/auth/student/password-reset/confirm/",
                {
                    "reset_token": reset_token,
                    "otp": "123456",
                    "password": "NewPassword123!",
                    "password_confirm": "NewPassword123!",
                },
                format="json",
            )

        self.assertEqual(response.status_code, 200)

        self.assertFalse(
            Token.objects.filter(
                key=token.key,
            ).exists()
        )