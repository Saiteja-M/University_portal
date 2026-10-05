from datetime import date, time, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from apps.academics.models import (
    AcademicYear,
    Course,
    CourseOffering,
    Department,
    Program,
    Regulation,
    Semester,
)
from apps.assignments.models import Assignment, AssignmentSubmission
from apps.attendance.models import AttendanceRecord, AttendanceSession
from apps.examinations.models import Exam, StudentResult
from apps.faculty.models import Faculty, FacultyCourseAssignment
from apps.students.models import (
    CourseOfferingEnrollment,
    Enrollment,
    Student,
)
from apps.timetable.models import TimetableSlot


class EndToEndAcademicWorkflowTests(TestCase):
    """Validate the locked academic chain from curriculum to results."""

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
        self.academic_year = AcademicYear.objects.create(
            name="2026-27",
            start_date=date(2026, 6, 1),
            end_date=date(2027, 5, 31),
            is_current=True,
        )
        self.regulation = Regulation.objects.create(
            program=self.program,
            code="R25",
            name="Regulation 2025",
            start_year=2025,
        )
        self.semester = Semester.objects.create(
            program=self.program,
            academic_year=self.academic_year,
            number=5,
            semester_type=Semester.SemesterType.ODD,
            is_active=True,
        )
        self.course = Course.objects.create(
            semester=self.semester,
            regulation=self.regulation,
            code="CS501",
            name="Computer Networks",
            credits=4,
            lecture_hours=4,
        )
        self.offering = CourseOffering.objects.create(
            course=self.course,
            academic_year=self.academic_year,
            semester=self.semester,
            section="A",
            capacity=2,
            status=CourseOffering.Status.OPEN,
            is_active=True,
        )

        self.faculty = Faculty.objects.create(
            faculty_id="FAC001",
            employee_id="EMP001",
            department=self.department,
            designation="Assistant Professor",
            joining_date=date(2025, 7, 1),
            status=Faculty.Status.ACTIVE,
        )
        self.assignment = FacultyCourseAssignment.objects.create(
            faculty=self.faculty,
            offering=self.offering,
            assigned_date=date(2026, 6, 1),
            is_active=True,
        )

        self.student = Student.objects.create(
            student_id="STU001",
            admission_number="ADM001",
            program=self.program,
            admission_date=date(2025, 7, 1),
            status=Student.Status.ACTIVE,
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student,
            academic_year=self.academic_year,
            semester=self.semester,
            status=Enrollment.Status.ACTIVE,
            enrollment_date=date(2026, 6, 10),
        )
        self.course_enrollment = CourseOfferingEnrollment.objects.create(
            student_enrollment=self.enrollment,
            offering=self.offering,
            status=CourseOfferingEnrollment.Status.ENROLLED,
            enrolled_date=date(2026, 6, 10),
        )

    def test_complete_workflow_reaches_results(self):
        timetable = TimetableSlot(
            offering=self.offering,
            faculty=self.faculty,
            day_of_week=TimetableSlot.DayOfWeek.MONDAY,
            period=1,
            start_time=time(9, 0),
            end_time=time(9, 50),
            room="CSE-101",
            building="Academic Block",
        )
        timetable.full_clean()
        timetable.save()

        session = AttendanceSession(
            faculty=self.faculty,
            offering=self.offering,
            course=self.course,
            academic_year=self.academic_year,
            semester=self.semester,
            session_date=date(2026, 9, 15),
            period=1,
            topic="Transport Layer",
        )
        session.full_clean()
        session.save()

        attendance = AttendanceRecord(
            session=session,
            student=self.student,
            status=AttendanceRecord.Status.PRESENT,
        )
        attendance.full_clean()
        attendance.save()

        assignment = Assignment(
            offering=self.offering,
            title="Transport Layer Assignment",
            description="Explain reliable transport protocols.",
            due_date=timezone.now() + timedelta(days=7),
            max_marks=20,
            status=Assignment.Status.PUBLISHED,
            is_active=True,
        )
        assignment.full_clean()
        assignment.save()

        submission = AssignmentSubmission(
            assignment=assignment,
            student=self.student,
            answer_text="TCP provides reliable, ordered delivery.",
            marks=18,
            status=AssignmentSubmission.Status.GRADED,
        )
        submission.full_clean()
        submission.save()

        exam = Exam.objects.create(
            name="Mid-I",
            exam_type=Exam.ExamType.MID_I,
            semester=self.semester,
            start_date=date(2026, 10, 1),
            end_date=date(2026, 10, 2),
            max_marks=30,
            is_active=True,
        )

        result = StudentResult(
            student=self.student,
            exam=exam,
            course_offering=self.offering,
            marks=Decimal("27.00"),
            grade="A",
            grade_point=Decimal("9.00"),
            status=StudentResult.Status.PASS,
        )
        result.full_clean()
        result.save()

        self.assertEqual(timetable.offering_id, self.offering.id)
        self.assertEqual(session.offering_id, self.offering.id)
        self.assertEqual(attendance.student_id, self.student.id)
        self.assertEqual(submission.assignment_id, assignment.id)
        self.assertEqual(result.course_offering_id, self.offering.id)

    def test_downstream_records_reject_broken_academic_links(self):
        wrong_department = Department.objects.create(
            code="ECE",
            name="Electronics and Communication Engineering",
        )
        wrong_program = Program.objects.create(
            department=wrong_department,
            code="BTECH-ECE",
            name="B.Tech Electronics and Communication Engineering",
        )
        wrong_semester = Semester.objects.create(
            program=wrong_program,
            academic_year=self.academic_year,
            number=5,
            semester_type=Semester.SemesterType.ODD,
            is_active=True,
        )
        wrong_course = Course.objects.create(
            semester=wrong_semester,
            regulation=Regulation.objects.create(
                program=wrong_program,
                code="R25-ECE",
                name="ECE Regulation 2025",
                start_year=2025,
            ),
            code="EC501",
            name="Digital Systems",
        )

        with self.assertRaises(ValidationError):
            TimetableSlot(
                offering=self.offering,
                faculty=self.faculty,
                day_of_week=TimetableSlot.DayOfWeek.TUESDAY,
                period=2,
                start_time=time(10, 0),
                end_time=time(10, 50),
                room="ECE-101",
                building="Academic Block",
            ).full_clean()

        with self.assertRaises(ValidationError):
            AttendanceSession(
                faculty=self.faculty,
                offering=self.offering,
                course=wrong_course,
                academic_year=self.academic_year,
                semester=self.semester,
                session_date=date(2026, 9, 16),
                period=2,
            ).full_clean()

        exam = Exam.objects.create(
            name="Semester End",
            exam_type=Exam.ExamType.SEMESTER,
            semester=self.semester,
            start_date=date(2026, 11, 1),
            end_date=date(2026, 11, 10),
            max_marks=100,
        )

        with self.assertRaises(ValidationError):
            StudentResult(
                student=self.student,
                exam=exam,
                course_offering=CourseOffering(
                    course=self.course,
                    academic_year=self.academic_year,
                    semester=wrong_semester,
                    section="B",
                    status=CourseOffering.Status.OPEN,
                ),
                marks=Decimal("80.00"),
            ).full_clean()
