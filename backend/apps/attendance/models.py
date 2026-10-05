from django.core.exceptions import ValidationError
from django.db import models

from apps.academics.models import AcademicYear, Course, Semester, CourseOffering
from apps.faculty.models import Faculty
from apps.students.models import Student, CourseOfferingEnrollment


class AttendanceSession(models.Model):
    """
    Represents one classroom attendance session.

    Example:
        Faculty: FAC001
        Course: CS501
        Academic Year: 2026-27
        Semester: 5
        Date: 2026-09-17
        Period: 2
    """

    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.PROTECT,
        related_name="attendance_sessions",
    )

    offering = models.ForeignKey(
        CourseOffering,
        on_delete=models.PROTECT,
        related_name="attendance_sessions",
        null=True,
        blank=True,
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name="attendance_sessions",
    )

    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="attendance_sessions",
    )

    semester = models.ForeignKey(
        Semester,
        on_delete=models.PROTECT,
        related_name="attendance_sessions",
    )

    session_date = models.DateField()

    period = models.PositiveSmallIntegerField()

    topic = models.CharField(
        max_length=255,
        blank=True,
    )

    remarks = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-session_date",
            "period",
            "course__code",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "faculty",
                    "course",
                    "academic_year",
                    "semester",
                    "session_date",
                    "period",
                ],
                name="unique_attendance_session",
            ),
        ]

        indexes = [
    models.Index(
        fields=["session_date", "course"],
        name="att_sess_date_course_idx",
    ),
    models.Index(
        fields=["faculty", "session_date"],
        name="att_sess_fac_date_idx",
    ),
    models.Index(
        fields=["semester", "session_date"],
        name="att_sess_sem_date_idx",
    ),
]

    def clean(self):
        errors = {}

        # --------------------------------------------------
        # Course → Semester integrity
        # --------------------------------------------------

        if self.course_id and self.semester_id:
            if self.course.semester_id != self.semester_id:
                errors["semester"] = (
                    "The selected semester does not "
                    "match the course semester."
                )

        # --------------------------------------------------
        # Semester → Academic Year integrity
        # --------------------------------------------------

        if (
            self.semester_id
            and self.academic_year_id
        ):
            if (
                self.semester.academic_year_id
                != self.academic_year_id
            ):
                errors["academic_year"] = (
                    "The selected academic year does "
                    "not match the semester."
                )

        # --------------------------------------------------
        # Course offering integrity
        # --------------------------------------------------

        if self.offering_id:
            if not self.offering.is_active:
                errors["offering"] = "The selected course offering is inactive."
            if self.offering.status in {"CLOSED", "CANCELLED"}:
                errors["offering"] = "Attendance cannot be created for a closed or cancelled course offering."
            if self.offering.course_id != self.course_id:
                errors["offering"] = "The course offering does not match the selected course."
            if self.offering.academic_year_id != self.academic_year_id:
                errors["offering"] = "The course offering does not match the selected academic year."
            if self.offering.semester_id != self.semester_id:
                errors["offering"] = "The course offering does not match the selected semester."
            if not self.offering.faculty_assignments.filter(
                faculty_id=self.faculty_id,
                is_active=True,
            ).exists():
                errors["faculty"] = "The faculty member is not assigned to this course offering."

        # --------------------------------------------------
        # Faculty → Course assignment integrity
        # --------------------------------------------------

        if (
            self.faculty_id
            and self.course_id
            and self.academic_year_id
            and self.semester_id
        ):
            assignment_exists = (
                self.faculty.course_assignments.filter(
                    course_id=self.course_id,
                    academic_year_id=self.academic_year_id,
                    semester_id=self.semester_id,
                ).exists()
            )

            if not assignment_exists:
                errors["faculty"] = (
                    "The faculty member is not assigned "
                    "to this course for the selected "
                    "academic year and semester."
                )

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return (
            f"{self.course.code} - "
            f"{self.session_date} - "
            f"Period {self.period}"
        )


class AttendanceRecord(models.Model):
    """
    Stores attendance for one student in one session.
    """

    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "Late"

    session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        related_name="records",
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="attendance_records",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
    )

    marked_at = models.DateTimeField(
        auto_now=True,
    )

    remarks = models.CharField(
        max_length=255,
        blank=True,
    )

    class Meta:
        ordering = [
            "student",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "session",
                    "student",
                ],
                name="unique_student_attendance_per_session",
            ),
        ]

        indexes = [
    models.Index(
        fields=["student", "status"],
        name="att_rec_student_status_idx",
    ),
    models.Index(
        fields=["session", "status"],
        name="att_rec_session_status_idx",
    ),
]

    def clean(self):
        if not self.session_id or not self.student_id:
            return

        # --------------------------------------------------
        # Student must belong to the session semester
        # --------------------------------------------------

        if self.session.offering_id:
            enrolled = CourseOfferingEnrollment.objects.filter(
                student_enrollment__student_id=self.student_id,
                offering_id=self.session.offering_id,
                status=CourseOfferingEnrollment.Status.ENROLLED,
                student_enrollment__status="ACTIVE",
            ).exists()
        else:
            enrolled = self.student.enrollments.filter(
                semester_id=self.session.semester_id,
                academic_year_id=self.session.academic_year_id,
                status="ACTIVE",
            ).exists()

        if not enrolled:
            raise ValidationError(
                {
                    "student": (
                        "The student does not have an "
                        "active enrollment in the selected "
                        "semester and academic year."
                    )
                }
            )

    def __str__(self):
        return (
            f"{self.student} - "
            f"{self.session} - "
            f"{self.get_status_display()}"
        )