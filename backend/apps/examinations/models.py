from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.academics.models import Course, Semester
from apps.common.models import TimeStampedModel
from apps.students.models import Student


class Exam(TimeStampedModel):
    class ExamType(models.TextChoices):
        MID_I = "MID_I", "Mid-I"
        MID_II = "MID_II", "Mid-II"
        SEMESTER = "SEMESTER", "Semester End"
        LAB = "LAB", "Laboratory"
        INTERNAL = "INTERNAL", "Internal Assessment"

    name = models.CharField(max_length=100)

    exam_type = models.CharField(
        max_length=20,
        choices=ExamType.choices,
    )

    semester = models.ForeignKey(
        Semester,
        on_delete=models.PROTECT,
        related_name="exams",
    )

    start_date = models.DateField()
    end_date = models.DateField()

    max_marks = models.PositiveIntegerField(
        default=100,
        validators=[
            MinValueValidator(1),
        ],
    )

    is_published = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-start_date", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "name",
                    "semester",
                ],
                name="unique_exam_per_semester",
            ),
        ]

    def __str__(self):
        return f"{self.name} - Semester {self.semester.number}"


class StudentResult(TimeStampedModel):
    class Status(models.TextChoices):
        PASS = "PASS", "Pass"
        FAIL = "FAIL", "Fail"
        ABSENT = "ABSENT", "Absent"
        WITHHELD = "WITHHELD", "Withheld"

    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="exam_results",
    )

    exam = models.ForeignKey(
        Exam,
        on_delete=models.PROTECT,
        related_name="student_results",
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name="student_results",
    )

    marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
        ],
    )

    grade = models.CharField(
        max_length=5,
        blank=True,
    )

    grade_point = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(10),
        ],
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PASS,
    )

    remarks = models.TextField(blank=True)

    class Meta:
        ordering = [
            "course__code",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "student",
                    "exam",
                    "course",
                ],
                name="unique_student_exam_course_result",
            ),
        ]

    def __str__(self):
        return (
            f"{self.student.student_id} - "
            f"{self.course.code} - "
            f"{self.exam.name}"
        )