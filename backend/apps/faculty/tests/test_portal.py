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
from apps.faculty.models import Faculty, FacultyCourseAssignment
from apps.faculty.portal import FacultyMyCourseViewSet


class FacultyPortalScopeTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )
        self.program = Program.objects.create(
            department=self.department,
            code="BTECH-CSE",
            name="B.Tech CSE",
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
            number=5,
            semester_type=Semester.SemesterType.ODD,
            is_active=True,
        )
        self.regulation = Regulation.objects.create(
            program=self.program,
            code="R25",
            name="Regulation 2025",
            start_year=2025,
        )
        self.course = Course.objects.create(
            semester=self.semester,
            regulation=self.regulation,
            code="CS501",
            name="Advanced Computing",
            credits=4,
        )
        self.open_offering = CourseOffering.objects.create(
            course=self.course,
            academic_year=self.academic_year,
            semester=self.semester,
            section="A",
            capacity=60,
            status=CourseOffering.Status.OPEN,
            is_active=True,
        )
        self.closed_offering = CourseOffering.objects.create(
            course=self.course,
            academic_year=self.academic_year,
            semester=self.semester,
            section="B",
            capacity=60,
            status=CourseOffering.Status.CLOSED,
            is_active=True,
        )
        self.user = User.objects.create_user(
            username="faculty.portal",
            password="test-password",
        )
        self.faculty = Faculty.objects.create(
            user=self.user,
            faculty_id="FAC001",
            employee_id="EMP001",
            department=self.department,
            designation="Assistant Professor",
            employment_type=Faculty.EmploymentType.PERMANENT,
            joining_date=date(2020, 7, 1),
            status=Faculty.Status.ACTIVE,
        )
        FacultyCourseAssignment.objects.create(
            faculty=self.faculty,
            offering=self.open_offering,
            assigned_date=date(2026, 6, 10),
            is_active=True,
        )
        FacultyCourseAssignment.objects.create(
            faculty=self.faculty,
            offering=self.closed_offering,
            assigned_date=date(2026, 6, 10),
            is_active=True,
        )

    def _faculty_queryset(self):
        request = APIRequestFactory().get("/api/v1/faculty/my-courses/")
        request = Request(request)
        request.user = self.user
        view = FacultyMyCourseViewSet()
        view.request = request
        return view.get_queryset()

    def test_my_courses_only_exposes_deliverable_offerings(self):
        queryset = self._faculty_queryset()
        offering_ids = set(queryset.values_list("offering_id", flat=True))

        self.assertIn(self.open_offering.id, offering_ids)
        self.assertNotIn(self.closed_offering.id, offering_ids)

    def test_inactive_faculty_has_no_portal_courses(self):
        self.faculty.status = Faculty.Status.ON_LEAVE
        self.faculty.save(update_fields=["status"])

        self.assertFalse(self._faculty_queryset().exists())
