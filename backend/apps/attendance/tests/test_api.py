from datetime import date

from django.contrib.auth.models import User
from apps.accounts.models import UserProfile
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.academics.models import (
    AcademicYear,
    Course,
    Department,
    Program,
    Regulation,
    Semester,
)
from apps.faculty.models import (
    Faculty,
    FacultyCourseAssignment,
)
from apps.students.models import Enrollment, Student

from ..models import AttendanceRecord, AttendanceSession


class AttendanceAPITestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )

        cls.program = Program.objects.create(
            department=cls.department,
            code="BTECH-CSE",
            name="B.Tech Computer Science and Engineering",
            duration_years=4,
        )

        cls.academic_year = AcademicYear.objects.create(
            name="2026-27",
            start_date=date(2026, 7, 1),
            end_date=date(2027, 6, 30),
            is_current=True,
        )

        cls.semester = Semester.objects.create(
            program=cls.program,
            academic_year=cls.academic_year,
            number=1,
            semester_type=Semester.SemesterType.ODD,
        )

        cls.regulation = Regulation.objects.create(
            program=cls.program,
            code="R25",
            name="Regulation 2025",
            start_year=2025,
        )

        cls.course = Course.objects.create(
            semester=cls.semester,
            regulation=cls.regulation,
            code="CS101",
            name="Programming Fundamentals",
            credits=4,
        )

        cls.faculty_user = User.objects.create_user(
            username="api.faculty",
            password="test-password",
            first_name="API",
            last_name="Faculty",
        )
        UserProfile.objects.create(
    user=cls.faculty_user,
    user_type=UserProfile.UserType.FACULTY,
    employee_or_student_id="API-FAC-001",
)

        cls.faculty = Faculty.objects.create(
            user=cls.faculty_user,
            employee_id="API-FAC-001",
            department=cls.department,
            designation="Assistant Professor",
            joining_date=date(2024, 7, 1),
            employment_status=Faculty.EmploymentStatus.ACTIVE,
            is_active=True,
        )

        FacultyCourseAssignment.objects.create(
            faculty=cls.faculty,
            course=cls.course,
            academic_year=cls.academic_year,
            semester=cls.semester,
            role=FacultyCourseAssignment.Role.PRIMARY,
        )

        cls.student_user = User.objects.create_user(
            username="api.student",
            password="test-password",
            first_name="API",
            last_name="Student",
        )

        cls.student = Student.objects.create(
            user=cls.student_user,
            program=cls.program,
            admission_date=date(2026, 7, 1),
        )

        Enrollment.objects.create(
            student=cls.student,
            academic_year=cls.academic_year,
            semester=cls.semester,
            status=Enrollment.Status.ACTIVE,
            enrollment_date=date(2026, 7, 1),
        )

        cls.session = AttendanceSession.objects.create(
            faculty=cls.faculty,
            course=cls.course,
            academic_year=cls.academic_year,
            semester=cls.semester,
            session_date=date(2026, 9, 18),
            period=1,
            topic="Introduction",
        )

    def setUp(self):
        self.client = APIClient()

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(
            user=user
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {token.key}"
        )

    def test_unauthenticated_session_list_is_rejected(self):
        response = self.client.get(
            "/api/v1/attendance/sessions/"
        )

        self.assertIn(
            response.status_code,
            [401, 403],
        )

    def test_faculty_can_list_own_sessions(self):
        self.authenticate(self.faculty_user)

        response = self.client.get(
            "/api/v1/attendance/sessions/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.data["results"]),
            1,
        )

    def test_faculty_can_view_own_session(self):
        self.authenticate(self.faculty_user)

        response = self.client.get(
            f"/api/v1/attendance/sessions/"
            f"{self.session.id}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["id"],
            self.session.id,
        )

    def test_faculty_can_mark_attendance(self):
        self.authenticate(self.faculty_user)

        response = self.client.post(
            f"/api/v1/attendance/sessions/"
            f"{self.session.id}/mark/",
            {
                "attendance": [
                    {
                        "student_id": self.student.id,
                        "status": "PRESENT",
                        "remarks": "",
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertTrue(
            AttendanceRecord.objects.filter(
                session=self.session,
                student=self.student,
                status="PRESENT",
            ).exists()
        )

    def test_session_summary_endpoint(self):
        AttendanceRecord.objects.create(
            session=self.session,
            student=self.student,
            status="PRESENT",
        )

        self.authenticate(self.faculty_user)

        response = self.client.get(
            f"/api/v1/attendance/sessions/"
            f"{self.session.id}/summary/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["total"],
            1,
        )

        self.assertEqual(
            response.data["present"],
            1,
        )

        self.assertEqual(
            response.data["attendance_percentage"],
            100,
        )