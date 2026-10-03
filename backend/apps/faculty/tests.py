from datetime import date

from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.academics.models import (
    AcademicYear,
    Course,
    Department,
    Program,
    Semester,
    Regulation,
)

from apps.faculty.models import (
    Faculty,
    FacultyCourseAssignment,
    FacultyExperience,
    FacultyProfile,
    FacultyQualification,
)


class FacultyAPITestCase(TestCase):

    def setUp(self):
        self.client = APIClient()

        # =========================================================
        # ADMIN USER
        # =========================================================

        self.admin_user = User.objects.create_user(
            username="faculty_test_admin",
            password="TestPassword123!",
            first_name="Test",
            last_name="Admin",
            email="admin@example.com",
        )

        self.admin_group, _ = Group.objects.get_or_create(
            name="ADMIN"
        )

        self.admin_user.groups.add(self.admin_group)

        self.token = Token.objects.create(
            user=self.admin_user
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {self.token.key}"
        )

        # =========================================================
        # DEPARTMENTS
        # =========================================================

        self.cse = Department.objects.create(
            code="TEST-CSE",
            name="Test Computer Science",
            description="Faculty API test department",
            is_active=True,
        )

        self.aiml = Department.objects.create(
            code="TEST-AIML",
            name="Test Artificial Intelligence",
            description="Faculty API cross-department test",
            is_active=True,
        )

        # =========================================================
        # PROGRAMS
        # =========================================================

        self.cse_program = Program.objects.create(
            department=self.cse,
            code="TEST-BTECH-CSE",
            name="B.Tech Computer Science",
            duration_years=4,
            is_active=True,
        )

        self.aiml_program = Program.objects.create(
            department=self.aiml,
            code="TEST-BTECH-AIML",
            name="B.Tech Artificial Intelligence",
            duration_years=4,
            is_active=True,
        )

        # =========================================================
        # ACADEMIC YEARS
        # =========================================================

        self.academic_year = AcademicYear.objects.create(
            name="TEST-2026-27",
            start_date=date(2026, 6, 1),
            end_date=date(2027, 5, 31),
            is_current=True,
        )

        self.other_academic_year = AcademicYear.objects.create(
            name="TEST-2027-28",
            start_date=date(2027, 6, 1),
            end_date=date(2028, 5, 31),
            is_current=False,
        )

        # =========================================================
        # SEMESTERS
        # =========================================================

        self.cse_semester_1 = Semester.objects.create(
            program=self.cse_program,
            academic_year=self.academic_year,
            number=1,
            semester_type=Semester.SemesterType.ODD,
            is_active=True,
        )

        self.cse_semester_2 = Semester.objects.create(
            program=self.cse_program,
            academic_year=self.academic_year,
            number=2,
            semester_type=Semester.SemesterType.EVEN,
            is_active=True,
        )

        self.aiml_semester_1 = Semester.objects.create(
            program=self.aiml_program,
            academic_year=self.academic_year,
            number=1,
            semester_type=Semester.SemesterType.ODD,
            is_active=True,
        )

        # =========================================================
        # REGULATIONS
        # =========================================================

        self.cse_regulation = Regulation.objects.create(
            program=self.cse_program,
            code="TEST-R24",
            name="Test Regulation 2024",
            start_year=2024,
            is_active=True,
        )

        self.aiml_regulation = Regulation.objects.create(
            program=self.aiml_program,
            code="TEST-R24-AIML",
            name="Test Regulation 2024 AIML",
            start_year=2024,
            is_active=True,
        )

        # =========================================================
        # COURSES
        # =========================================================

        self.cse_course = Course.objects.create(
            semester=self.cse_semester_1,
            regulation=self.cse_regulation,
            code="TEST-CSE101",
            name="Test Mathematics",
            credits=4,
            is_active=True,
        )

        self.aiml_course = Course.objects.create(
            semester=self.aiml_semester_1,
            regulation=self.aiml_regulation,
            code="TEST-AIML101",
            name="Test Artificial Intelligence",
            credits=4,
            is_active=True,
        )

        # =========================================================
        # FACULTY USER
        # =========================================================

        self.faculty_user = User.objects.create_user(
            username="test_faculty",
            password="TestPassword123!",
            first_name="Test",
            last_name="Faculty",
            email="faculty@example.com",
        )

        # =========================================================
        # FACULTY
        # =========================================================

        self.faculty = Faculty.objects.create(
            user=self.faculty_user,
            faculty_id="TEST-FAC001",
            employee_id="TEST-EMP001",
            department=self.cse,
            designation="Assistant Professor",
            employment_type=Faculty.EmploymentType.PERMANENT,
            joining_date=date(2026, 7, 1),
            status=Faculty.Status.ACTIVE,
        )

        # =========================================================
        # INACTIVE FACULTY
        # =========================================================

        self.inactive_user = User.objects.create_user(
            username="inactive_faculty",
            password="TestPassword123!",
            first_name="Inactive",
            last_name="Faculty",
            email="inactive@example.com",
        )

        self.inactive_faculty = Faculty.objects.create(
            user=self.inactive_user,
            faculty_id="TEST-FAC002",
            employee_id="TEST-EMP002",
            department=self.cse,
            designation="Assistant Professor",
            employment_type=Faculty.EmploymentType.PERMANENT,
            joining_date=date(2026, 7, 1),
            status=Faculty.Status.ON_LEAVE,
        )

    # =============================================================
    # FACULTY API
    # =============================================================

    def test_faculty_list_requires_authentication(self):
        self.client.credentials()

        response = self.client.get(
            "/api/v1/faculty/faculty/"
        )

        self.assertEqual(response.status_code, 401)

    def test_faculty_list_returns_faculty(self):
        response = self.client.get(
            "/api/v1/faculty/faculty/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "TEST-FAC001",
            str(response.data),
        )

    def test_create_faculty(self):
        new_user = User.objects.create_user(
            username="new_test_faculty",
            password="TestPassword123!",
            first_name="New",
            last_name="Faculty",
            email="newfaculty@example.com",
        )

        payload = {
            "user": new_user.id,
            "faculty_id": "TEST-FAC003",
            "employee_id": "TEST-EMP003",
            "department": self.cse.id,
            "designation": "Associate Professor",
            "employment_type": "PERMANENT",
            "joining_date": "2026-08-01",
            "status": "ACTIVE",
        }

        response = self.client.post(
            "/api/v1/faculty/faculty/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        faculty = Faculty.objects.get(
            faculty_id="TEST-FAC003"
        )

        self.assertEqual(
            faculty.user_id,
            new_user.id,
        )

    # =============================================================
    # FACULTY PROFILE API
    # =============================================================

    def test_create_faculty_profile(self):
        payload = {
            "faculty": self.faculty.id,
            "first_name": "Test",
            "last_name": "Faculty",
            "date_of_birth": "1995-06-15",
            "gender": "MALE",
            "blood_group": "O+",
            "phone_number": "9876543210",
            "alternate_phone_number": "",
            "institutional_email": "test.faculty@example.edu",
            "personal_email": "",
            "address": "Test Address",
            "city": "Wanaparthy",
            "state": "Telangana",
            "postal_code": "509103",
        }

        response = self.client.post(
            "/api/v1/faculty/profiles/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        self.assertTrue(
            FacultyProfile.objects.filter(
                faculty=self.faculty
            ).exists()
        )

    def test_duplicate_faculty_profile_is_rejected(self):
        FacultyProfile.objects.create(
            faculty=self.faculty,
            first_name="Existing",
            last_name="Faculty",
            date_of_birth=date(1995, 1, 1),
            gender="MALE",
            phone_number="9000000000",
            institutional_email="existing@example.edu",
        )

        payload = {
            "faculty": self.faculty.id,
            "first_name": "Duplicate",
            "last_name": "Faculty",
            "date_of_birth": "1995-06-15",
            "gender": "MALE",
            "phone_number": "9876543210",
            "institutional_email": "duplicate@example.edu",
        }

        response = self.client.post(
            "/api/v1/faculty/profiles/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    # =============================================================
    # QUALIFICATION API
    # =============================================================

    def test_create_faculty_qualification(self):
        payload = {
            "faculty": self.faculty.id,
            "degree": "M.Tech",
            "specialization": "Artificial Intelligence",
            "institution": "Test Institute",
            "university": "Test University",
            "year_of_passing": 2020,
            "grade_or_percentage": "8.5 CGPA",
        }

        response = self.client.post(
            "/api/v1/faculty/qualifications/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        self.assertTrue(
            FacultyQualification.objects.filter(
                faculty=self.faculty
            ).exists()
        )

    # =============================================================
    # EXPERIENCE API
    # =============================================================

    def test_create_faculty_experience(self):
        payload = {
            "faculty": self.faculty.id,
            "organization": "Test University",
            "designation": "Assistant Professor",
            "start_date": "2021-07-01",
            "end_date": None,
            "description": "Teaching and academic responsibilities.",
        }

        response = self.client.post(
            "/api/v1/faculty/experiences/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        self.assertTrue(
            FacultyExperience.objects.filter(
                faculty=self.faculty
            ).exists()
        )

    def test_invalid_experience_date_range_is_rejected(self):
        payload = {
            "faculty": self.faculty.id,
            "organization": "Test University",
            "designation": "Assistant Professor",
            "start_date": "2025-01-01",
            "end_date": "2024-01-01",
            "description": "Invalid experience.",
        }

        response = self.client.post(
            "/api/v1/faculty/experiences/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    # =============================================================
    # COURSE ASSIGNMENT API
    # =============================================================

    def test_create_course_assignment(self):
        payload = {
            "faculty": self.faculty.id,
            "course": self.cse_course.id,
            "academic_year": self.academic_year.id,
            "semester": self.cse_semester_1.id,
            "section": "A",
            "assigned_date": "2026-07-01",
            "is_active": True,
        }

        response = self.client.post(
            "/api/v1/faculty/course-assignments/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        self.assertTrue(
            FacultyCourseAssignment.objects.filter(
                faculty=self.faculty,
                course=self.cse_course,
                academic_year=self.academic_year,
                semester=self.cse_semester_1,
            ).exists()
        )

    def test_duplicate_course_assignment_is_rejected(self):
        FacultyCourseAssignment.objects.create(
            faculty=self.faculty,
            course=self.cse_course,
            academic_year=self.academic_year,
            semester=self.cse_semester_1,
            section="A",
            assigned_date=date(2026, 7, 1),
            is_active=True,
        )

        payload = {
            "faculty": self.faculty.id,
            "course": self.cse_course.id,
            "academic_year": self.academic_year.id,
            "semester": self.cse_semester_1.id,
            "section": "A",
            "assigned_date": "2026-07-01",
            "is_active": True,
        }

        response = self.client.post(
            "/api/v1/faculty/course-assignments/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_course_semester_mismatch_is_rejected(self):
        payload = {
            "faculty": self.faculty.id,
            "course": self.cse_course.id,
            "academic_year": self.academic_year.id,
            "semester": self.cse_semester_2.id,
            "section": "A",
            "assigned_date": "2026-07-01",
            "is_active": True,
        }

        response = self.client.post(
            "/api/v1/faculty/course-assignments/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_academic_year_semester_mismatch_is_rejected(self):
        payload = {
            "faculty": self.faculty.id,
            "course": self.cse_course.id,
            "academic_year": self.other_academic_year.id,
            "semester": self.cse_semester_1.id,
            "section": "A",
            "assigned_date": "2027-07-01",
            "is_active": True,
        }

        response = self.client.post(
            "/api/v1/faculty/course-assignments/",
            payload,
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    # =============================================================
    # FILTERING
    # =============================================================

    def test_faculty_search_by_employee_id(self):
        response = self.client.get(
            "/api/v1/faculty/faculty/",
            {"search": "TEST-EMP001"},
        )

        self.assertEqual(response.status_code, 200)

    def test_faculty_filter_by_department(self):
        response = self.client.get(
            "/api/v1/faculty/faculty/",
            {"department": self.cse.id},
        )

        self.assertEqual(response.status_code, 200)

    def test_course_assignment_list(self):
        FacultyCourseAssignment.objects.create(
            faculty=self.faculty,
            course=self.cse_course,
            academic_year=self.academic_year,
            semester=self.cse_semester_1,
            section="A",
            assigned_date=date(2026, 7, 1),
            is_active=True,
        )

        response = self.client.get(
            "/api/v1/faculty/course-assignments/"
        )

        self.assertEqual(response.status_code, 200)

        self.assertIn(
            "TEST-CSE101",
            str(response.data),
        )

    # =============================================================
    # RBAC
    # =============================================================

    def create_role_user(self, username, role):
        user = User.objects.create_user(
            username=username,
            password="TestPassword123!",
        )

        group, _ = Group.objects.get_or_create(
            name=role
        )

        user.groups.add(group)

        Token.objects.create(
            user=user
        )

        return user

    def authenticate_as(self, user):
        token, _ = Token.objects.get_or_create(
            user=user
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {token.key}"
        )

    def test_faculty_role_can_view_faculty(self):
        faculty_user = self.create_role_user(
            "rbac_faculty_viewer",
            "FACULTY",
        )

        self.authenticate_as(faculty_user)

        response = self.client.get(
            "/api/v1/faculty/faculty/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_student_role_cannot_view_faculty(self):
        student_user = self.create_role_user(
            "rbac_student_viewer",
            "STUDENT",
        )

        self.authenticate_as(student_user)

        response = self.client.get(
            "/api/v1/faculty/faculty/"
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_faculty_role_cannot_create_faculty(self):
        faculty_user = self.create_role_user(
            "rbac_faculty_creator",
            "FACULTY",
        )

        self.authenticate_as(faculty_user)

        payload = {
            "faculty_id": "RBAC-FAC001",
            "employee_id": "RBAC-EMP001",
            "department": self.cse.id,
            "designation": "Assistant Professor",
            "employment_type": "PERMANENT",
            "joining_date": "2026-08-01",
            "status": "ACTIVE",
        }

        response = self.client.post(
            "/api/v1/faculty/faculty/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_student_role_cannot_create_faculty(self):
        student_user = self.create_role_user(
            "rbac_student_creator",
            "STUDENT",
        )

        self.authenticate_as(student_user)

        payload = {
            "faculty_id": "RBAC-FAC002",
            "employee_id": "RBAC-EMP002",
            "department": self.cse.id,
            "designation": "Assistant Professor",
            "employment_type": "PERMANENT",
            "joining_date": "2026-08-01",
            "status": "ACTIVE",
        }

        response = self.client.post(
            "/api/v1/faculty/faculty/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_hod_can_view_faculty(self):
        hod_user = self.create_role_user(
            "rbac_hod_viewer",
            "HOD",
        )

        self.authenticate_as(hod_user)

        response = self.client.get(
            "/api/v1/faculty/faculty/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

    def test_hod_cannot_create_faculty(self):
        hod_user = self.create_role_user(
            "rbac_hod_creator",
            "HOD",
        )

        self.authenticate_as(hod_user)

        payload = {
            "faculty_id": "RBAC-HOD-FAC001",
            "employee_id": "RBAC-HOD-EMP001",
            "department": self.cse.id,
            "designation": "Assistant Professor",
            "employment_type": "PERMANENT",
            "joining_date": "2026-08-01",
            "status": "ACTIVE",
        }

        response = self.client.post(
            "/api/v1/faculty/faculty/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_admin_can_create_faculty(self):
        payload = {
            "faculty_id": "RBAC-ADMIN-FAC001",
            "employee_id": "RBAC-ADMIN-EMP001",
            "department": self.cse.id,
            "designation": "Assistant Professor",
            "employment_type": "PERMANENT",
            "joining_date": "2026-08-01",
            "status": "ACTIVE",
        }

        response = self.client.post(
            "/api/v1/faculty/faculty/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )