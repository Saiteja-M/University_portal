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
from apps.students.models import (
    CourseOfferingEnrollment,
    Enrollment,
    Student,
)


class CourseOfferingEnrollmentIntegrityTests(TestCase):
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
            capacity=1,
            status=CourseOffering.Status.OPEN,
        )
        self.student1 = Student.objects.create(
            student_id="STU001",
            admission_number="ADM001",
            program=program,
            admission_date=date(2025, 7, 1),
            status=Student.Status.ACTIVE,
        )
        self.student2 = Student.objects.create(
            student_id="STU002",
            admission_number="ADM002",
            program=program,
            admission_date=date(2025, 7, 1),
            status=Student.Status.ACTIVE,
        )
        self.enrollment1 = Enrollment.objects.create(
            student=self.student1,
            academic_year=academic_year,
            semester=semester,
            status=Enrollment.Status.ACTIVE,
            enrollment_date=date(2026, 6, 15),
        )
        self.enrollment2 = Enrollment.objects.create(
            student=self.student2,
            academic_year=academic_year,
            semester=semester,
            status=Enrollment.Status.ACTIVE,
            enrollment_date=date(2026, 6, 15),
        )

    def test_capacity_is_enforced(self):
        CourseOfferingEnrollment.objects.create(
            student_enrollment=self.enrollment1,
            offering=self.offering,
            status=CourseOfferingEnrollment.Status.ENROLLED,
            enrolled_date=date(2026, 6, 16),
        )

        second = CourseOfferingEnrollment(
            student_enrollment=self.enrollment2,
            offering=self.offering,
            status=CourseOfferingEnrollment.Status.ENROLLED,
            enrolled_date=date(2026, 6, 16),
        )
        with self.assertRaisesMessage(Exception, "capacity"):
            second.full_clean()

    def test_inactive_student_cannot_be_enrolled(self):
        self.student2.status = Student.Status.INACTIVE
        self.student2.save(update_fields=["status", "updated_at"])

        candidate = CourseOfferingEnrollment(
            student_enrollment=self.enrollment2,
            offering=self.offering,
            status=CourseOfferingEnrollment.Status.ENROLLED,
            enrolled_date=date(2026, 6, 16),
        )
        with self.assertRaisesMessage(Exception, "active students"):
            candidate.full_clean()
