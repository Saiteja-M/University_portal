from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError
from django.db import models

from apps.academics.models import CourseOffering, Semester
from apps.common.models import TimeStampedModel
from apps.students.models import CourseOfferingEnrollment, Student


class Exam(TimeStampedModel):
    class ExamType(models.TextChoices):
        MID_I = "MID_I", "Mid-I"
        MID_II = "MID_II", "Mid-II"
        SEMESTER = "SEMESTER", "Semester End"
        LAB = "LAB", "Laboratory"
        INTERNAL = "INTERNAL", "Internal Assessment"

    name = models.CharField(max_length=100)
    exam_type = models.CharField(max_length=20, choices=ExamType.choices)
    semester = models.ForeignKey(
        Semester, on_delete=models.PROTECT, related_name="exams"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    max_marks = models.PositiveIntegerField(
        default=100, validators=[MinValueValidator(1)]
    )
    is_published = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-start_date", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "semester"],
                name="unique_exam_per_semester",
            ),
        ]

    def clean(self):
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": "End date cannot be earlier than start date."})

    def __str__(self):
        return f"{self.name} - Semester {self.semester.number}"


class StudentResult(TimeStampedModel):
    class Status(models.TextChoices):
        PASS = "PASS", "Pass"
        FAIL = "FAIL", "Fail"
        ABSENT = "ABSENT", "Absent"
        WITHHELD = "WITHHELD", "Withheld"

    student = models.ForeignKey(
        Student, on_delete=models.PROTECT, related_name="exam_results"
    )
    exam = models.ForeignKey(
        Exam, on_delete=models.PROTECT, related_name="student_results"
    )
    course_offering = models.ForeignKey(
        CourseOffering,
        on_delete=models.PROTECT,
        related_name="exam_results",
    )
    marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    grade = models.CharField(max_length=5, blank=True)
    grade_point = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PASS
    )
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["course_offering__course__code", "student__student_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "exam", "course_offering"],
                name="unique_student_exam_offering_result",
            ),
        ]
        indexes = [
            models.Index(fields=["exam", "course_offering"]),
            models.Index(fields=["student", "exam"]),
        ]

    def clean(self):
        errors = {}
        if self.exam_id and self.course_offering_id:
            if self.exam.semester_id != self.course_offering.semester_id:
                errors["course_offering"] = (
                    "The course offering must belong to the examination semester."
                )
            if self.course_offering.status in {
                CourseOffering.Status.CLOSED,
                CourseOffering.Status.CANCELLED,
            } or not self.course_offering.is_active:
                errors["course_offering"] = (
                    "The selected course offering is not active."
                )

        if self.student_id and self.course_offering_id:
            enrollment_exists = CourseOfferingEnrollment.objects.filter(
                student_enrollment__student_id=self.student_id,
                offering_id=self.course_offering_id,
                status=CourseOfferingEnrollment.Status.ENROLLED,
                student_enrollment__status="ACTIVE",
            ).exists()
            if not enrollment_exists:
                errors["student"] = (
                    "The student is not actively enrolled in this course offering."
                )

        if self.exam_id and self.marks is not None and self.marks > self.exam.max_marks:
            errors["marks"] = f"Marks cannot exceed the examination maximum of {self.exam.max_marks}."

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return (
            f"{self.student.student_id} - "
            f"{self.course_offering.course.code} - {self.exam.name}"
        )
