from datetime import date

from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from apps.academics.models import (
    AcademicYear,
    Course,
    Department,
    Program,
    Regulation,
    Semester,
)
from apps.faculty.models import (
    Faculty,
    FacultyCourseAssignment,
)
from apps.students.models import Enrollment, Student

from ..models import AttendanceRecord, AttendanceSession
from ..services import (
    get_session_summary,
    mark_attendance,
)


class AttendanceServiceTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.department = Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )

        cls.program = Program.objects.create(
            department=cls.department,
            code="BTECH-CSE",
            name="B.Tech Computer Science and Engineering",
            duration_years=4,
        )

        cls.academic_year = AcademicYear.objects.create(
            name="2026-27",
            start_date=date(2026, 7, 1),
            end_date=date(2027, 6, 30),
            is_current=True,
        )

        cls.semester = Semester.objects.create(
            program=cls.program,
            academic_year=cls.academic_year,
            number=1,
            semester_type=Semester.SemesterType.ODD,
        )

        cls.regulation = Regulation.objects.create(
            program=cls.program,
            code="R25",
            name="Regulation 2025",
            start_year=2025,
        )

        cls.course = Course.objects.create(
            semester=cls.semester,
            regulation=cls.regulation,
            code="CS101",
            name="Programming Fundamentals",
            credits=4,
        )

        cls.faculty_user = User.objects.create_user(
            username="attendance.faculty",
            password="test-password",
            first_name="Attendance",
            last_name="Faculty",
        )

        cls.faculty = Faculty.objects.create(
            user=cls.faculty_user,
            employee_id="FAC-001",
            department=cls.department,
            designation="Assistant Professor",
            joining_date=date(2024, 7, 1),
            employment_status=Faculty.EmploymentStatus.ACTIVE,
            is_active=True,
        )

        FacultyCourseAssignment.objects.create(
            faculty=cls.faculty,
            course=cls.course,
            academic_year=cls.academic_year,
            semester=cls.semester,
            role=FacultyCourseAssignment.Role.PRIMARY,
        )

        cls.student_user = User.objects.create_user(
            username="attendance.student",
            password="test-password",
            first_name="Attendance",
            last_name="Student",
        )

        cls.student = Student.objects.create(
           user=cls.student_user,
           program=cls.program,
           admission_date=date(2026, 7, 1),
)
        cls.enrollment = Enrollment.objects.create(
            student=cls.student,
            academic_year=cls.academic_year,
            semester=cls.semester,
            status=Enrollment.Status.ACTIVE,
            enrollment_date=date(2026, 7, 1),
        )

        cls.session = AttendanceSession.objects.create(
            faculty=cls.faculty,
            course=cls.course,
            academic_year=cls.academic_year,
            semester=cls.semester,
            session_date=date(2026, 9, 18),
            period=1,
            topic="Introduction to Programming",
        )

    def test_mark_attendance_creates_record(self):
        records = mark_attendance(
            session=self.session,
            attendance_data=[
                {
                    "student_id": self.student.id,
                    "status": AttendanceRecord.Status.PRESENT,
                    "remarks": "",
                }
            ],
        )

        self.assertEqual(len(records), 1)

        record = AttendanceRecord.objects.get(
            session=self.session,
            student=self.student,
        )

        self.assertEqual(
            record.status,
            AttendanceRecord.Status.PRESENT,
        )

    def test_mark_attendance_updates_existing_record(self):
        AttendanceRecord.objects.create(
            session=self.session,
            student=self.student,
            status=AttendanceRecord.Status.ABSENT,
        )

        mark_attendance(
            session=self.session,
            attendance_data=[
                {
                    "student_id": self.student.id,
                    "status": AttendanceRecord.Status.PRESENT,
                    "remarks": "Corrected",
                }
            ],
        )

        record = AttendanceRecord.objects.get(
            session=self.session,
            student=self.student,
        )

        self.assertEqual(
            record.status,
            AttendanceRecord.Status.PRESENT,
        )

        self.assertEqual(
            record.remarks,
            "Corrected",
        )

    def test_duplicate_student_in_submission_is_rejected(self):
        with self.assertRaises(ValidationError):
            mark_attendance(
                session=self.session,
                attendance_data=[
                    {
                        "student_id": self.student.id,
                        "status": AttendanceRecord.Status.PRESENT,
                    },
                    {
                        "student_id": self.student.id,
                        "status": AttendanceRecord.Status.ABSENT,
                    },
                ],
            )

    def test_empty_attendance_is_rejected(self):
        with self.assertRaises(ValidationError):
            mark_attendance(
                session=self.session,
                attendance_data=[],
            )

    def test_invalid_status_is_rejected(self):
        with self.assertRaises(ValidationError):
            mark_attendance(
                session=self.session,
                attendance_data=[
                    {
                        "student_id": self.student.id,
                        "status": "INVALID",
                    }
                ],
            )

    def test_session_summary(self):
        AttendanceRecord.objects.create(
            session=self.session,
            student=self.student,
            status=AttendanceRecord.Status.PRESENT,
        )

        summary = get_session_summary(self.session)

        self.assertEqual(summary["total"], 1)
        self.assertEqual(summary["present"], 1)
        self.assertEqual(summary["absent"], 0)
        self.assertEqual(summary["late"], 0)
        self.assertEqual(
            summary["attendance_percentage"],
            100,
        )