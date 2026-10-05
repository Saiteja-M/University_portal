from datetime import date, timedelta

from django.test import TestCase

from apps.academics.models import AcademicYear, Department, Program, Semester
from apps.faculty.models import Faculty
from apps.faculty.serializers_core import FacultySerializer
from apps.students.models import Student, Enrollment
from apps.students.serializers import EnrollmentSerializer


class FacultyManagementValidationTests(TestCase):
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

    def test_future_joining_date_is_rejected(self):
        data = {
            "employee_id": "EMP001",
            "department": self.department.id,
            "designation": "Assistant Professor",
            "employment_type": "PERMANENT",
            "joining_date": date.today() + timedelta(days=1),
            "status": "ACTIVE",
        }
        serializer = FacultySerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("joining_date", serializer.errors)

    def test_inactive_department_is_rejected(self):
        self.department.is_active = False
        self.department.save(update_fields=["is_active"])

        data = {
            "employee_id": "EMP001",
            "department": self.department.id,
            "designation": "Assistant Professor",
            "employment_type": "PERMANENT",
            "joining_date": date(2020, 7, 1),
            "status": "ACTIVE",
        }
        serializer = FacultySerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("department", serializer.errors)


