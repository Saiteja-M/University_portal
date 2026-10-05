from datetime import date, time

from django.contrib.auth.models import User
from django.test import TestCase

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
from apps.timetable.models import TimetableSlot


class TimetableOperationalIntegrityTests(TestCase):
    def setUp(self):
        department = Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )
        program = Program.objects.create(
            department=department,
            code="BTECH-CSE",
            name="B.Tech CSE",
        )
        academic_year = AcademicYear.objects.create(
            name="2026-27",
            start_date=date(2026, 6, 1),
            end_date=date(2027, 5, 31),
            is_current=True,
        )
        semester = Semester.objects.create(
            program=program,
            academic_year=academic_year,
            number=5,
            semester_type=Semester.SemesterType.ODD,
        )
        regulation = Regulation.objects.create(
            program=program,
            code="R25",
            name="Regulation 2025",
            start_year=2025,
        )
        course = Course.objects.create(
            semester=semester,
            regulation=regulation,
            code="CS501",
            name="Operating Systems",
            credits=4,
        )
        self.offering = CourseOffering.objects.create(
            course=course,
            academic_year=academic_year,
            semester=semester,
            section="A",
            capacity=60,
            status=CourseOffering.Status.OPEN,
        )
        user = User.objects.create_user(username="faculty1", password="test-pass-123")
        self.faculty = Faculty.objects.create(
            user=user,
            faculty_id="FAC001",
            employee_id="EMP001",
            department=department,
            designation="Assistant Professor",
            joining_date=date(2020, 7, 1),
            status=Faculty.Status.ACTIVE,
        )
        FacultyCourseAssignment.objects.create(
            faculty=self.faculty,
            offering=self.offering,
            assigned_date=date(2026, 6, 15),
            is_active=True,
        )

    def test_same_faculty_cannot_be_scheduled_twice_in_one_period(self):
        TimetableSlot.objects.create(
            offering=self.offering,
            faculty=self.faculty,
            day_of_week=TimetableSlot.DayOfWeek.MONDAY,
            period=1,
            start_time=time(9, 0),
            end_time=time(9, 50),
            room="A101",
        )

        conflicting = TimetableSlot(
            offering=self.offering,
            faculty=self.faculty,
            day_of_week=TimetableSlot.DayOfWeek.MONDAY,
            period=1,
            start_time=time(9, 0),
            end_time=time(9, 50),
            room="A102",
        )
        with self.assertRaises(Exception):
            conflicting.save()
