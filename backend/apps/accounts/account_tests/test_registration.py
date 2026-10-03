from datetime import date
import re

from django.contrib.auth.models import Group, User
from django.core import mail
from rest_framework.test import APITestCase

from apps.academics.models import (
    AcademicYear,
    Department,
    Program,
    Semester,
)
from apps.accounts.models import OTPRecord, UserProfile
from apps.students.models import (
    Enrollment,
    Student,
    StudentProfile,
)


class StudentRegistrationTests(APITestCase):

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

        # Official university student record.
        # No Django User exists before registration.
        self.student = Student.objects.create(
            user=None,
            student_id="STU-1001",
            admission_number="ADM-1001",
            program=self.program,
            admission_date=date(2026, 6, 10),
            status=Student.Status.ACTIVE,
        )

        # Official identity information used during registration.
        StudentProfile.objects.create(
            student=self.student,
            date_of_birth=date(2005, 5, 15),
            gender=StudentProfile.Gender.MALE,
            blood_group="O+",
            phone_number="9876543210",
            institutional_email="student@example.com",
            city="Wanaparthy",
            state="Telangana",
            postal_code="509103",
        )

        # Semester 3 -> Study Year 2.
        Enrollment.objects.create(
            student=self.student,
            academic_year=self.academic_year,
            semester=self.semester,
            status=Enrollment.Status.ACTIVE,
            enrollment_date=date(2026, 6, 15),
        )

    def test_registration_options(self):
        response = self.client.get(
            "/api/v1/auth/student/registration/options/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("study_years", response.data)
        self.assertIn("programs", response.data)
        self.assertIn("academic_years", response.data)

    def test_registration_rejects_wrong_mobile(self):
        response = self.client.post(
            "/api/v1/auth/student/registration/verify/",
            {
                "student_id": "STU-1001",
                "mobile_number": "9999999999",
                "email": "student@example.com",
                "study_year": 2,
                "program_id": self.program.id,
                "academic_year_id": self.academic_year.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_registration_rejects_wrong_study_year(self):
        response = self.client.post(
            "/api/v1/auth/student/registration/verify/",
            {
                "student_id": "STU-1001",
                "mobile_number": "9876543210",
                "email": "student@example.com",
                "study_year": 1,
                "program_id": self.program.id,
                "academic_year_id": self.academic_year.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_registration_sends_otp(self):
        response = self.client.post(
            "/api/v1/auth/student/registration/verify/",
            {
                "student_id": "STU-1001",
                "mobile_number": "9876543210",
                "email": "student@example.com",
                "study_year": 2,
                "program_id": self.program.id,
                "academic_year_id": self.academic_year.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("registration_token", response.data)
        self.assertIn("student_id", response.data)

        self.assertEqual(len(mail.outbox), 1)

        self.assertIn(
            "University Portal Verification Code",
            mail.outbox[0].subject,
        )

    def test_registration_completion_creates_student_account(self):
        # ---------------------------------------------------------
        # Step 1: Verify identity and request OTP.
        # ---------------------------------------------------------

        verify_response = self.client.post(
            "/api/v1/auth/student/registration/verify/",
            {
                "student_id": "STU-1001",
                "mobile_number": "9876543210",
                "email": "student@example.com",
                "study_year": 2,
                "program_id": self.program.id,
                "academic_year_id": self.academic_year.id,
            },
            format="json",
        )

        self.assertEqual(
            verify_response.status_code,
            200,
            verify_response.data,
        )

        registration_token = verify_response.data[
            "registration_token"
        ]

        self.assertEqual(len(mail.outbox), 1)

        # ---------------------------------------------------------
        # Step 2: Extract the six-digit OTP from development email.
        # ---------------------------------------------------------

        email_body = mail.outbox[0].body

        otp_match = re.search(
            r"\b\d{6}\b",
            email_body,
        )

        self.assertIsNotNone(otp_match)

        otp = otp_match.group()

        # ---------------------------------------------------------
        # Step 3: Complete registration.
        # ---------------------------------------------------------

        complete_response = self.client.post(
            "/api/v1/auth/student/registration/complete/",
            {
                "registration_token": registration_token,
                "otp": otp,
                "password": "StrongStudentPassword123!",
                "password_confirm": "StrongStudentPassword123!",
            },
            format="json",
        )

        self.assertEqual(
            complete_response.status_code,
            200,
            complete_response.data,
        )

        self.assertEqual(
            complete_response.data["student_id"],
            "STU-1001",
        )

        # ---------------------------------------------------------
        # Step 4: Verify Student -> User relationship.
        # ---------------------------------------------------------

        self.student.refresh_from_db()

        self.assertIsNotNone(
            self.student.user_id
        )

        user = self.student.user

        self.assertIsNotNone(user)

        # ---------------------------------------------------------
        # Step 5: Verify Django authentication account.
        # ---------------------------------------------------------

        self.assertEqual(
            user.username,
            "STU-1001",
        )

        self.assertEqual(
            user.email,
            "student@example.com",
        )

        self.assertTrue(
            user.is_active
        )

        self.assertTrue(
            user.check_password(
                "StrongStudentPassword123!"
            )
        )

        # ---------------------------------------------------------
        # Step 6: Verify UserProfile.
        # ---------------------------------------------------------

        user_profile = UserProfile.objects.get(
            user=user
        )

        self.assertEqual(
            user_profile.user_type,
            UserProfile.UserType.STUDENT,
        )

        self.assertEqual(
            user_profile.employee_or_student_id,
            "STU-1001",
        )

        self.assertTrue(
            user_profile.is_student_registered
        )

        self.assertEqual(
            user_profile.phone_number,
            "9876543210",
        )

        # ---------------------------------------------------------
        # Step 7: Verify STUDENT RBAC group.
        # ---------------------------------------------------------

        student_group = Group.objects.get(
            name="STUDENT"
        )

        self.assertTrue(
            user.groups.filter(
                id=student_group.id
            ).exists()
        )

        # ---------------------------------------------------------
        # Step 8: Verify OTP was consumed.
        # ---------------------------------------------------------

        otp_record = (
            OTPRecord.objects
            .filter(
                student=self.student,
                purpose=OTPRecord.Purpose.REGISTRATION,
            )
            .latest("created_at")
        )

        self.assertIsNotNone(
            otp_record.used_at
        )

    def test_registration_rejects_already_registered_student(self):
        # Simulate a student who has already completed registration.

        user = User.objects.create_user(
            username="existing_student",
            email="student@example.com",
            password="ExistingPassword123!",
        )

        self.student.user = user

        self.student.save(
            update_fields=[
                "user",
                "updated_at",
            ]
        )

        UserProfile.objects.create(
            user=user,
            user_type=UserProfile.UserType.STUDENT,
            employee_or_student_id=self.student.student_id,
            is_student_registered=True,
        )

        response = self.client.post(
            "/api/v1/auth/student/registration/verify/",
            {
                "student_id": "STU-1001",
                "mobile_number": "9876543210",
                "email": "student@example.com",
                "study_year": 2,
                "program_id": self.program.id,
                "academic_year_id": self.academic_year.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )