from datetime import date

from django.test import TestCase

from apps.academics.models import AcademicYear, Department, Program, Semester
from apps.students.models import Student
from apps.students.serializers import EnrollmentSerializer


class StudentManagementValidationTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(code="ECE", name="Electronics and Communication Engineering")
        self.program = Program.objects.create(department=self.department, code="BTECH-ECE", name="B.Tech ECE")
        self.academic_year = AcademicYear.objects.create(name="2026-27", start_date=date(2026, 6, 1), end_date=date(2027, 5, 31))
        self.semester = Semester.objects.create(program=self.program, academic_year=self.academic_year, number=5, semester_type=Semester.SemesterType.ODD)
        self.student = Student.objects.create(student_id="STU001", admission_number="ADM001", program=self.program, admission_date=date(2025, 7, 1), status=Student.Status.ACTIVE)

    def test_inactive_program_is_rejected_for_enrollment(self):
        self.program.is_active = False
        self.program.save(update_fields=["is_active"])
        serializer = EnrollmentSerializer(data={"student": self.student.id, "academic_year": self.academic_year.id, "semester": self.semester.id, "status": "ACTIVE", "enrollment_date": date(2026, 6, 15)})
        self.assertFalse(serializer.is_valid())
        self.assertIn("student", serializer.errors)

    def test_inactive_semester_is_rejected_for_enrollment(self):
        self.semester.is_active = False
        self.semester.save(update_fields=["is_active"])
        serializer = EnrollmentSerializer(data={"student": self.student.id, "academic_year": self.academic_year.id, "semester": self.semester.id, "status": "ACTIVE", "enrollment_date": date(2026, 6, 15)})
        self.assertFalse(serializer.is_valid())
        self.assertIn("semester", serializer.errors)
