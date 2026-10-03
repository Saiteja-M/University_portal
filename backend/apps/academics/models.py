from django.db import models

from apps.common.models import TimeStampedModel


class Department(TimeStampedModel):
    code = models.CharField(
        max_length=20,
        unique=True,
    )
    name = models.CharField(
        max_length=150,
        unique=True,
    )
    description = models.TextField(
        blank=True,
    )
    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Program(TimeStampedModel):
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="programs",
    )
    code = models.CharField(
        max_length=30,
        unique=True,
    )
    name = models.CharField(
        max_length=200,
    )
    duration_years = models.PositiveSmallIntegerField(
        default=4,
    )
    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class AcademicYear(TimeStampedModel):
    name = models.CharField(
        max_length=20,
        unique=True,
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(
        default=False,
    )

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return self.name


class Semester(TimeStampedModel):
    class SemesterType(models.TextChoices):
        ODD = "ODD", "Odd"
        EVEN = "EVEN", "Even"

    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT,
        related_name="semesters",
    )
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.PROTECT,
        related_name="semesters",
    )
    number = models.PositiveSmallIntegerField()
    semester_type = models.CharField(
        max_length=10,
        choices=SemesterType.choices,
    )
    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["program", "number"]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "program",
                    "academic_year",
                    "number",
                ],
                name="unique_program_year_semester",
            ),
        ]

    def __str__(self):
        return (
            f"{self.program.code} - "
            f"Semester {self.number}"
        )
class Regulation(TimeStampedModel):
    """
    Defines the curriculum regulation applicable to a student
    based on their admission batch.

    Example:
        BTECH-CSE + R22
        BTECH-CSE + R25
    """

    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT,
        related_name="regulations",
    )
    code = models.CharField(
        max_length=30,
    )
    name = models.CharField(
        max_length=100,
    )

    # Admission year range for which this regulation applies.
    # Example:
    # R25 -> start_year=2025, end_year=None
    start_year = models.PositiveSmallIntegerField()
    end_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["-start_year", "code"]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "program",
                    "code",
                ],
                name="unique_program_regulation",
            ),
        ]

    def __str__(self):
        return f"{self.program.code} - {self.code}"


class Course(TimeStampedModel):
    semester = models.ForeignKey(
        Semester,
        on_delete=models.PROTECT,
        related_name="courses",
    )
    regulation = models.ForeignKey(
        Regulation,
        on_delete=models.PROTECT,
        related_name="courses",
    )
    code = models.CharField(max_length=30)
    name = models.CharField(max_length=200)
    credits = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["code"]
        constraints = [
            models.UniqueConstraint(
                fields=["regulation", "code"],
                name="unique_regulation_course_code",
            ),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError

        if (
            self.semester_id
            and self.regulation_id
            and self.semester.program_id != self.regulation.program_id
        ):
            raise ValidationError(
                "The course semester and regulation must belong to the same program."
            )

    def __str__(self):
        return f"{self.regulation.code} - {self.code}"