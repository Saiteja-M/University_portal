from datetime import date

from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.academics.models import (
    AcademicYear,
    Course,
    CourseOffering,
    Department,
    Program,
    Regulation,
    Semester,
)
from apps.faculty.models import Faculty, FacultyCourseAssignment


class FacultyAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="faculty_test_admin",
            password="TestPassword123!",
        )
        group, _ = Group.objects.get_or_create(name="ADMIN")
        self.admin.groups.add(group)
        token = Token.objects.create(user=self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        self.department = Department.objects.create(
            code="TEST-CSE",
            name="Test Computer Science",
            is_active=True,
        )
        self.program = Program.objects.create(
            department=self.department,
            code="TEST-BTECH-CSE",
            name="B.Tech CSE",
            duration_years=4,
            is_active=True,
        )
        self.academic_year = AcademicYear.objects.create(
            name="TEST-2026-27",
            start_date=date(2026, 6, 1),
            end_date=date(2027, 5, 31),
            is_current=True,
        )
        self.semester = Semester.objects.create(
            program=self.program,
            academic_year=self.academic_year,
            number=5,
            semester_type=Semester.SemesterType.ODD,
            is_active=True,
        )
        self.regulation = Regulation.objects.create(
            program=self.program,
            code="TEST-R25",
            name="Test Regulation 2025",
            start_year=2025,
            is_active=True,
        )
        self.course = Course.objects.create(
            semester=self.semester,
            regulation=self.regulation,
            code="TEST-CS501",
            name="Advanced Computing",
            credits=4,
            is_active=True,
        )
        self.offering = CourseOffering.objects.create(
            course=self.course,
            academic_year=self.academic_year,
            semester=self.semester,
            section="A",
            capacity=60,
            status=CourseOffering.Status.OPEN,
            is_active=True,
        )
        self.faculty_user = User.objects.create_user(
            username="test_faculty",
            password="TestPassword123!",
            first_name="Test",
            last_name="Faculty",
        )
        self.faculty = Faculty.objects.create(
            user=self.faculty_user,
            faculty_id="TEST-FAC001",
            employee_id="TEST-EMP001",
            department=self.department,
            designation="Assistant Professor",
            employment_type=Faculty.EmploymentType.PERMANENT,
            joining_date=date(2026, 7, 1),
            status=Faculty.Status.ACTIVE,
        )

    def test_faculty_list_returns_records(self):
        response = self.client.get("/api/v1/faculty/faculty/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("TEST-FAC001", str(response.data))

    def test_create_faculty_creates_portal_account_when_requested(self):
        response = self.client.post(
            "/api/v1/faculty/faculty/",
            {
                "faculty_id": "TEST-FAC002",
                "employee_id": "TEST-EMP002",
                "department": self.department.id,
                "designation": "Associate Professor",
                "employment_type": "PERMANENT",
                "joining_date": "2026-08-01",
                "status": "ACTIVE",
                "create_username": "new_test_faculty",
                "create_password": "TestPassword123!",
                "create_first_name": "New",
                "create_last_name": "Faculty",
                "create_email": "newfaculty@example.com",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        faculty = Faculty.objects.get(faculty_id="TEST-FAC002")
        self.assertIsNotNone(faculty.user_id)
        self.assertEqual(faculty.user.username, "new_test_faculty")
        self.assertTrue(faculty.user.groups.filter(name="FACULTY").exists())

    def test_create_course_assignment_uses_course_offering(self):
        response = self.client.post(
            "/api/v1/faculty/course-assignments/",
            {
                "faculty": self.faculty.id,
                "offering": self.offering.id,
                "assigned_date": "2026-07-01",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            FacultyCourseAssignment.objects.filter(
                faculty=self.faculty,
                offering=self.offering,
            ).exists()
        )

    def test_closed_offering_cannot_receive_assignment(self):
        self.offering.status = CourseOffering.Status.CLOSED
        self.offering.save(update_fields=["status"])
        response = self.client.post(
            "/api/v1/faculty/course-assignments/",
            {
                "faculty": self.faculty.id,
                "offering": self.offering.id,
                "assigned_date": "2026-07-01",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_inactive_faculty_cannot_receive_assignment(self):
        self.faculty.status = Faculty.Status.ON_LEAVE
        self.faculty.save(update_fields=["status"])
        response = self.client.post(
            "/api/v1/faculty/course-assignments/",
            {
                "faculty": self.faculty.id,
                "offering": self.offering.id,
                "assigned_date": "2026-07-01",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_duplicate_course_assignment_is_rejected(self):
        FacultyCourseAssignment.objects.create(
            faculty=self.faculty,
            offering=self.offering,
            assigned_date=date(2026, 7, 1),
            is_active=True,
        )
        response = self.client.post(
            "/api/v1/faculty/course-assignments/",
            {
                "faculty": self.faculty.id,
                "offering": self.offering.id,
                "assigned_date": "2026-07-02",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_student_role_cannot_create_faculty(self):
        user = User.objects.create_user(
            username="student_role",
            password="TestPassword123!",
        )
        group, _ = Group.objects.get_or_create(name="STUDENT")
        user.groups.add(group)
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = self.client.post(
            "/api/v1/faculty/faculty/",
            {
                "employee_id": "RBAC-EMP001",
                "department": self.department.id,
                "designation": "Assistant Professor",
                "employment_type": "PERMANENT",
                "joining_date": "2026-08-01",
                "status": "ACTIVE",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)
