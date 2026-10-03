from datetime import date

from django.contrib.auth.models import Group, User
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.academics.models import (
    AcademicYear,
    Department,
    Program,
    Semester,
)
from apps.students.models import (
    Enrollment,
    Student,
    StudentProfile,
)


class StudentsAPIAndRBACTests(APITestCase):

    def setUp(self):
        self.department = Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )

        self.program = Program.objects.create(
            department=self.department,
            code="BTECH-CSE",
            name=(
                "Bachelor of Technology in "
                "Computer Science and Engineering"
            ),
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

    def create_user_with_role(self, username, role):
        user = User.objects.create_user(
            username=username,
            password="TestPass123!",
        )

        group, _ = Group.objects.get_or_create(
            name=role,
        )

        user.groups.add(group)

        token = Token.objects.create(
            user=user,
        )

        return user, token

    def authenticate(self, token):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {token.key}"
        )

    def create_student(self, username="student_user"):
        user = User.objects.create_user(
            username=username,
            password="StudentPass123!",
            first_name="Test",
            last_name="Student",
            email=f"{username}@example.com",
        )

        return Student.objects.create(
            user=user,
            student_id=f"STU-{user.id:04d}",
            admission_number=f"ADM-{user.id:04d}",
            program=self.program,
            admission_date=date(2026, 6, 10),
            status=Student.Status.ACTIVE,
        )

    # ------------------------------------------------------------------
    # Student creation
    # ------------------------------------------------------------------

    def test_admin_can_create_student(self):
        _, token = self.create_user_with_role(
            "admin_user",
            "ADMIN",
        )

        self.authenticate(token)

        response = self.client.post(
            "/api/v1/students/students/",
            {
                "student_id": "STU-1001",
                "admission_number": "ADM-1001",
                "program": self.program.id,
                "admission_date": "2026-06-10",
                "status": "ACTIVE",

                "create_date_of_birth": "2005-05-15",
                "create_gender": "MALE",
                "create_blood_group": "O+",
                "create_phone_number": "9876543210",
                "create_institutional_email": (
                    "student.admin@university.edu"
                ),
                "create_alternate_phone_number": "",
                "create_address": "University Address",
                "create_city": "Wanaparthy",
                "create_state": "Telangana",
                "create_postal_code": "509103",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertEqual(
            Student.objects.count(),
            1,
        )

        student = Student.objects.get(
            student_id="STU-1001",
        )

        self.assertEqual(
            student.admission_number,
            "ADM-1001",
        )

        self.assertEqual(
            student.program,
            self.program,
        )

        # Student account is NOT created by Admin.
        self.assertIsNone(
            student.user,
        )

        # Student profile is created during official onboarding.
        profile = StudentProfile.objects.get(
            student=student,
        )

        self.assertEqual(
            profile.date_of_birth,
            date(2005, 5, 15),
        )

        self.assertEqual(
            profile.gender,
            StudentProfile.Gender.MALE,
        )

        self.assertEqual(
            profile.blood_group,
            "O+",
        )

        self.assertEqual(
            profile.phone_number,
            "9876543210",
        )

        self.assertEqual(
            profile.institutional_email,
            "student.admin@university.edu",
        )

        self.assertEqual(
            profile.city,
            "Wanaparthy",
        )

        self.assertEqual(
            profile.state,
            "Telangana",
        )

        # Password must never be returned by the API.
        self.assertNotIn(
            "create_password",
            response.data,
        )

        # Old account-creation fields must no longer exist.
        self.assertNotIn(
            "create_username",
            response.data,
        )

        self.assertNotIn(
            "create_email",
            response.data,
        )

    def test_hod_can_create_student(self):
        _, token = self.create_user_with_role(
            "hod_user",
            "HOD",
        )

        self.authenticate(token)

        response = self.client.post(
            "/api/v1/students/students/",
            {
                "student_id": "STU-1002",
                "admission_number": "ADM-1002",
                "program": self.program.id,
                "admission_date": "2026-06-10",
                "status": "ACTIVE",

                "create_date_of_birth": "2005-06-20",
                "create_gender": "MALE",
                "create_blood_group": "A+",
                "create_phone_number": "9876543211",
                "create_institutional_email": (
                    "student.hod@university.edu"
                ),
                "create_alternate_phone_number": "",
                "create_address": "University Address",
                "create_city": "Wanaparthy",
                "create_state": "Telangana",
                "create_postal_code": "509103",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        student = Student.objects.get(
            student_id="STU-1002",
        )

        # HOD also creates only the official student record.
        self.assertIsNone(
            student.user,
        )

        profile = StudentProfile.objects.get(
            student=student,
        )

        self.assertEqual(
            profile.date_of_birth,
            date(2005, 6, 20),
        )

        self.assertEqual(
            profile.gender,
            StudentProfile.Gender.MALE,
        )

        self.assertEqual(
            profile.blood_group,
            "A+",
        )

        self.assertEqual(
            profile.phone_number,
            "9876543211",
        )

        self.assertEqual(
            profile.institutional_email,
            "student.hod@university.edu",
        )

    # ------------------------------------------------------------------
    # Role-based access control
    # ------------------------------------------------------------------

    def test_faculty_can_view_students(self):
        self.create_student()

        _, token = self.create_user_with_role(
            "faculty_user",
            "FACULTY",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/students/students/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_faculty_cannot_create_student(self):
        _, token = self.create_user_with_role(
            "faculty_user",
            "FACULTY",
        )

        self.authenticate(token)

        user = User.objects.create_user(
            username="faculty_created_student",
            password="StudentPass123!",
        )

        response = self.client.post(
            "/api/v1/students/students/",
            {
                "student_id": "STU-1003",
                "admission_number": "ADM-1003",
                "user": user.id,
                "program": self.program.id,
                "admission_date": "2026-06-10",
                "status": "ACTIVE",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_accountant_cannot_view_students(self):
        _, token = self.create_user_with_role(
            "accountant_user",
            "ACCOUNTANT",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/students/students/"
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_unauthenticated_user_cannot_access_students(self):
        response = self.client.get(
            "/api/v1/students/students/"
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    # ------------------------------------------------------------------
    # Search and filtering
    # ------------------------------------------------------------------

    def test_student_search(self):
        student = self.create_student(
            username="search_student",
        )

        _, token = self.create_user_with_role(
            "search_faculty",
            "FACULTY",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/students/students/"
            f"?search={student.student_id}"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

        self.assertEqual(
            response.data["results"][0]["student_id"],
            student.student_id,
        )

    def test_student_filter_by_status(self):
        active_student = self.create_student(
            username="active_student",
        )

        inactive_user = User.objects.create_user(
            username="inactive_student",
            password="StudentPass123!",
        )

        Student.objects.create(
            user=inactive_user,
            student_id="STU-INACTIVE",
            admission_number="ADM-INACTIVE",
            program=self.program,
            admission_date=date(2026, 6, 10),
            status=Student.Status.INACTIVE,
        )

        _, token = self.create_user_with_role(
            "filter_faculty",
            "FACULTY",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/students/students/"
            "?status=ACTIVE"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

        self.assertEqual(
            response.data["results"][0]["student_id"],
            active_student.student_id,
        )

    # ------------------------------------------------------------------
    # Pagination
    # ------------------------------------------------------------------

    def test_student_pagination(self):
        for number in range(30):
            user = User.objects.create_user(
                username=f"pagination_student_{number}",
                password="StudentPass123!",
            )

            Student.objects.create(
                user=user,
                student_id=f"PAG-{number:03d}",
                admission_number=f"PAG-ADM-{number:03d}",
                program=self.program,
                admission_date=date(2026, 6, 10),
            )

        _, token = self.create_user_with_role(
            "pagination_faculty",
            "FACULTY",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/students/students/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["count"],
            30,
        )

        self.assertEqual(
            len(response.data["results"]),
            25,
        )

        response = self.client.get(
            "/api/v1/students/students/?page=2"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            len(response.data["results"]),
            5,
        )

    # ------------------------------------------------------------------
    # Profile
    # ------------------------------------------------------------------

    def test_student_profile_creation(self):
        student = self.create_student(
            username="profile_student",
        )

        _, token = self.create_user_with_role(
            "profile_admin",
            "ADMIN",
        )

        self.authenticate(token)

        response = self.client.post(
            "/api/v1/students/profiles/",
            {
                "student": student.id,
                "date_of_birth": "2005-05-15",
                "gender": "MALE",
                "blood_group": "O+",
                "phone_number": "9876543210",
                "institutional_email": "profile@university.edu",
                "city": "Hyderabad",
                "state": "Telangana",
                "postal_code": "500001",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertTrue(
            StudentProfile.objects.filter(
                student=student
            ).exists()
        )

    # ------------------------------------------------------------------
    # Guardian
    # ------------------------------------------------------------------

    def test_guardian_creation(self):
        student = self.create_student(
            username="guardian_student",
        )

        _, token = self.create_user_with_role(
            "guardian_admin",
            "ADMIN",
        )

        self.authenticate(token)

        response = self.client.post(
            "/api/v1/students/guardians/",
            {
                "student": student.id,
                "name": "Test Parent",
                "relationship": "FATHER",
                "phone_number": "9876543210",
                "email": "parent@example.com",
                "occupation": "Engineer",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

    # ------------------------------------------------------------------
    # Enrollment
    # ------------------------------------------------------------------

    def test_enrollment_creation(self):
        student = self.create_student(
            username="enrollment_student",
        )

        _, token = self.create_user_with_role(
            "enrollment_admin",
            "ADMIN",
        )

        self.authenticate(token)

        response = self.client.post(
            "/api/v1/students/enrollments/",
            {
                "student": student.id,
                "academic_year": self.academic_year.id,
                "semester": self.semester.id,
                "enrollment_date": "2026-06-15",
                "status": "ACTIVE",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertTrue(
            Enrollment.objects.filter(
                student=student,
                semester=self.semester,
            ).exists()
        )

    def test_enrollment_rejects_wrong_program_semester(self):
        other_department = Department.objects.create(
            code="ECE",
            name=(
                "Electronics and Communication Engineering"
            ),
        )

        other_program = Program.objects.create(
            department=other_department,
            code="BTECH-ECE",
            name=(
                "Bachelor of Technology in "
                "Electronics and Communication Engineering"
            ),
            duration_years=4,
        )

        wrong_semester = Semester.objects.create(
            program=other_program,
            academic_year=self.academic_year,
            number=3,
            semester_type=Semester.SemesterType.ODD,
        )

        student = self.create_student(
            username="wrong_program_student",
        )

        _, token = self.create_user_with_role(
            "wrong_program_admin",
            "ADMIN",
        )

        self.authenticate(token)

        response = self.client.post(
            "/api/v1/students/enrollments/",
            {
                "student": student.id,
                "academic_year": self.academic_year.id,
                "semester": wrong_semester.id,
                "enrollment_date": "2026-06-15",
                "status": "ACTIVE",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )