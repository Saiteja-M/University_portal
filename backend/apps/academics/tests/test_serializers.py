from datetime import date

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
from apps.academics.serializers import (
    AcademicYearSerializer,
    CourseOfferingSerializer,
    CourseSerializer,
    RegulationSerializer,
    SemesterSerializer,
)


class AcademicCoreSerializerTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )
        self.program = Program.objects.create(
            department=self.department,
            code="BTECH-CSE",
            name="B.Tech Computer Science and Engineering",
        )
        self.other_program = Program.objects.create(
            department=self.department,
            code="BTECH-AIML",
            name="B.Tech Artificial Intelligence and Machine Learning",
        )
        self.year = AcademicYear.objects.create(
            name="2026-27",
            start_date=date(2026, 6, 1),
            end_date=date(2027, 5, 31),
            is_current=True,
        )
        self.next_year = AcademicYear.objects.create(
            name="2027-28",
            start_date=date(2027, 6, 1),
            end_date=date(2028, 5, 31),
        )
        self.semester = Semester.objects.create(
            program=self.program,
            academic_year=self.year,
            number=1,
            semester_type=Semester.SemesterType.ODD,
        )
        self.regulation = Regulation.objects.create(
            program=self.program,
            code="R25",
            name="Regulation 2025",
            start_year=2025,
        )

    def test_academic_year_partial_update_validates_existing_dates(self):
        serializer = AcademicYearSerializer(
            self.year,
            data={"name": "2026-27 Updated"},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_second_current_academic_year_is_rejected(self):
        serializer = AcademicYearSerializer(
            self.next_year,
            data={"is_current": True},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("is_current", serializer.errors)

    def test_regulation_partial_update_validates_existing_start_year(self):
        serializer = RegulationSerializer(
            self.regulation,
            data={"name": "Updated Regulation"},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_even_semester_cannot_be_marked_odd(self):
        serializer = SemesterSerializer(
            data={
                "program": self.program.id,
                "academic_year": self.year.id,
                "number": 2,
                "semester_type": Semester.SemesterType.ODD,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("semester_type", serializer.errors)

    def test_course_cannot_mix_program_and_regulation(self):
        serializer = CourseSerializer(
            data={
                "semester": self.semester.id,
                "regulation": Regulation.objects.create(
                    program=self.other_program,
                    code="R25",
                    name="Other Regulation",
                    start_year=2025,
                ).id,
                "code": "CS101",
                "name": "Programming",
                "credits": 4,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("regulation", serializer.errors)

    def test_offering_cannot_use_wrong_semester(self):
        other_semester = Semester.objects.create(
            program=self.other_program,
            academic_year=self.year,
            number=1,
            semester_type=Semester.SemesterType.ODD,
        )
        course = Course.objects.create(
            semester=self.semester,
            regulation=self.regulation,
            code="CS101",
            name="Programming",
            credits=4,
        )

        serializer = CourseOfferingSerializer(
            data={
                "course": course.id,
                "academic_year": self.year.id,
                "semester": other_semester.id,
                "section": "A",
                "capacity": 60,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("semester", serializer.errors)
