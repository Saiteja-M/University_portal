from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from apps.academics.models import (
    AcademicYear,
    Course,
    CourseOffering,
    Department,
    Program,
    Regulation,
    Semester,
)
from apps.students.models import CourseOfferingEnrollment, Enrollment, Student
from apps.students.views import StudentViewSet


class StudentPortalScopeTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )
        self.program = Program.objects.create(
            department=self.department,
            code="BTECH-CSE",
            name="B.Tech CSE",
            is_active=True,
        )

        self.current_year = AcademicYear.objects.create(
            name="2026-27",
            start_date=date(2026, 6, 1),
            end_date=date(2027, 5, 31),
            is_current=True,
        )
        self.old_year = AcademicYear.objects.create(
            name="2025-26",
            start_date=date(2025, 6, 1),
            end_date=date(2026, 5, 31),
            is_current=False,
        )

        self.current_semester = Semester.objects.create(
            program=self.program,
            academic_year=self.current_year,
            number=5,
            semester_type=Semester.SemesterType.ODD,
            is_active=True,
        )
        self.old_semester = Semester.objects.create(
            program=self.program,
            academic_year=self.old_year,
            number=3,
            semester_type=Semester.SemesterType.ODD,
            is_active=True,
        )

        self.regulation = Regulation.objects.create(
            program=self.program,
            code="R25",
            name="Regulation 2025",
            start_year=2025,
        )

        self.current_course = Course.objects.create(
            semester=self.current_semester,
            regulation=self.regulation,
            code="CS501",
            name="Advanced Computing",
            credits=4,
        )
        self.old_course = Course.objects.create(
            semester=self.old_semester,
            regulation=self.regulation,
            code="CS301",
            name="Data Structures",
            credits=4,
        )

        self.current_offering = CourseOffering.objects.create(
            course=self.current_course,
            academic_year=self.current_year,
            semester=self.current_semester,
            section="A",
            capacity=60,
            status=CourseOffering.Status.OPEN,
            is_active=True,
        )
        self.old_offering = CourseOffering.objects.create(
            course=self.old_course,
            academic_year=self.old_year,
            semester=self.old_semester,
            section="A",
            capacity=60,
            status=CourseOffering.Status.OPEN,
            is_active=True,
        )

        self.user = User.objects.create_user(
            username="student.portal",
            password="test-password",
        )
        self.student = Student.objects.create(
            user=self.user,
            student_id="STU001",
            admission_number="ADM001",
            program=self.program,
            admission_date=date(2025, 7, 1),
            status=Student.Status.ACTIVE,
        )

        self.current_enrollment = Enrollment.objects.create(
            student=self.student,
            academic_year=self.current_year,
            semester=self.current_semester,
            status=Enrollment.Status.ACTIVE,
            enrollment_date=date(2026, 6, 10),
        )
        self.old_enrollment = Enrollment.objects.create(
            student=self.student,
            academic_year=self.old_year,
            semester=self.old_semester,
            status=Enrollment.Status.ACTIVE,
            enrollment_date=date(2025, 6, 10),
        )

        CourseOfferingEnrollment.objects.create(
            student_enrollment=self.current_enrollment,
            offering=self.current_offering,
            status=CourseOfferingEnrollment.Status.ENROLLED,
            enrolled_date=date(2026, 6, 10),
        )
        CourseOfferingEnrollment.objects.create(
            student_enrollment=self.old_enrollment,
            offering=self.old_offering,
            status=CourseOfferingEnrollment.Status.ENROLLED,
            enrolled_date=date(2025, 6, 10),
        )

    def _me_courses(self):
        request = APIRequestFactory().get("/api/v1/students/me/courses/")
        request = Request(request)
        request.user = self.user

        view = StudentViewSet()
        view.request = request
        return view.me_courses(request)

    def test_me_courses_uses_current_active_enrollment_only(self):
        response = self._me_courses()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["academic_year_name"], "2026-27")
        self.assertEqual(response.data["course_count"], 1)
        self.assertEqual(response.data["results"][0]["code"], "CS501")

    def test_me_courses_does_not_fall_back_to_non_current_enrollment(self):
        self.current_enrollment.status = Enrollment.Status.COMPLETED
        self.current_enrollment.save(update_fields=["status"])

        response = self._me_courses()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["course_count"], 0)
        self.assertEqual(response.data["results"], [])
