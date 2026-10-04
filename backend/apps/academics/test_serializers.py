from datetime import date

from django.test import TestCase

from .models import AcademicYear, Department, Program, Regulation, Semester, Course
from .serializers import AcademicYearSerializer, CourseSerializer


class AcademicSerializerPartialUpdateTests(TestCase):
    def test_academic_year_patch_can_update_one_date(self):
        year = AcademicYear.objects.create(
            name="2026-27",
            start_date=date(2026, 7, 1),
            end_date=date(2027, 6, 30),
        )

        serializer = AcademicYearSerializer(
            instance=year,
            data={"end_date": "2027-07-01"},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.end_date, date(2027, 7, 1))

    def test_course_patch_rejects_regulation_from_another_program(self):
        department = Department.objects.create(
            code="CSE",
            name="Computer Science",
        )
        other_department = Department.objects.create(
            code="ECE",
            name="Electronics",
        )
        program = Program.objects.create(
            department=department,
            code="BTECH-CSE",
            name="B.Tech CSE",
        )
        other_program = Program.objects.create(
            department=other_department,
            code="BTECH-ECE",
            name="B.Tech ECE",
        )
        year = AcademicYear.objects.create(
            name="2026-27",
            start_date=date(2026, 7, 1),
            end_date=date(2027, 6, 30),
        )
        semester = Semester.objects.create(
            program=program,
            academic_year=year,
            number=1,
            semester_type=Semester.SemesterType.ODD,
        )
        regulation = Regulation.objects.create(
            program=program,
            code="R25",
            name="Regulation 2025",
            start_year=2025,
        )
        other_regulation = Regulation.objects.create(
            program=other_program,
            code="R25",
            name="Regulation 2025",
            start_year=2025,
        )
        course = Course.objects.create(
            semester=semester,
            regulation=regulation,
            code="CS101",
            name="Programming Fundamentals",
            credits=4,
        )

        serializer = CourseSerializer(
            instance=course,
            data={"regulation": other_regulation.pk},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("regulation", serializer.errors)
