from django.contrib.auth.models import User
from django.db import models

from apps.academics.models import Program, Semester
from apps.common.models import TimeStampedModel


class Student(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        GRADUATED = "GRADUATED", "Graduated"
        SUSPENDED = "SUSPENDED", "Suspended"
        DROPPED = "DROPPED", "Dropped"

    # A Student record can exist before the student creates
    # their portal account. Therefore, User is optional.
    user = models.OneToOneField(
        User,
        on_delete=models.PROTECT,
        related_name="student",
        null=True,
        blank=True,
    )

    # Official university/student roll number.
    student_id = models.CharField(
        max_length=30,
        unique=True,
    )

    # Official admission number assigned by the university.
    admission_number = models.CharField(
        max_length=50,
        unique=True,
    )

    # Academic program in which the student is admitted.
    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT,
        related_name="students",
    )

    # Official admission date.
    admission_date = models.DateField()

    # Institutional status of the student.
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    class Meta:
        ordering = ["student_id"]

    def __str__(self):
        """
        A student may not have a User account yet.

        Before registration:
            STU001 - Not Registered

        After registration:
            STU001 - Saiteja Mathamala
        """
        if self.user:
            full_name = self.user.get_full_name().strip()

            if full_name:
                return f"{self.student_id} - {full_name}"

            return self.student_id

        return f"{self.student_id} - Not Registered"


class StudentProfile(TimeStampedModel):
    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"

    class BloodGroup(models.TextChoices):
        A_POSITIVE = "A+", "A+"
        A_NEGATIVE = "A-", "A-"
        B_POSITIVE = "B+", "B+"
        B_NEGATIVE = "B-", "B-"
        AB_POSITIVE = "AB+", "AB+"
        AB_NEGATIVE = "AB-", "AB-"
        O_POSITIVE = "O+", "O+"
        O_NEGATIVE = "O-", "O-"

    student = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    # Student photograph
    photo = models.ImageField(
        upload_to="students/photos/",
        blank=True,
        null=True,
    )

    date_of_birth = models.DateField()

    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
    )

    blood_group = models.CharField(
        max_length=3,
        choices=BloodGroup.choices,
        blank=True,
    )

    phone_number = models.CharField(
        max_length=20,
        blank=True,
    )

    alternate_phone_number = models.CharField(
        max_length=20,
        blank=True,
    )
    institutional_email = models.EmailField(
    blank=True,
)

    address = models.TextField(
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    state = models.CharField(
        max_length=100,
        blank=True,
    )

    postal_code = models.CharField(
        max_length=20,
        blank=True,
    )

    class Meta:
        ordering = ["student"]

    def __str__(self):
        return f"Profile - {self.student.student_id}"


class Guardian(TimeStampedModel):
    class Relationship(models.TextChoices):
        FATHER = "FATHER", "Father"
        MOTHER = "MOTHER", "Mother"
        GUARDIAN = "GUARDIAN", "Guardian"
        OTHER = "OTHER", "Other"

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="guardians",
    )

    name = models.CharField(
        max_length=150,
    )

    relationship = models.CharField(
        max_length=20,
        choices=Relationship.choices,
    )

    phone_number = models.CharField(
        max_length=20,
    )

    email = models.EmailField(
        blank=True,
    )

    occupation = models.CharField(
        max_length=150,
        blank=True,
    )

    address = models.TextField(
        blank=True,
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} - {self.student.student_id}"


class Enrollment(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"

    student = models.ForeignKey(
        Student,
        on_delete=models.PROTECT,
        related_name="enrollments",
    )

    academic_year = models.ForeignKey(
        "academics.AcademicYear",
        on_delete=models.PROTECT,
        related_name="student_enrollments",
    )

    semester = models.ForeignKey(
        Semester,
        on_delete=models.PROTECT,
        related_name="student_enrollments",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    enrollment_date = models.DateField()

    class Meta:
        ordering = [
            "-academic_year__start_date",
            "student",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "student",
                    "academic_year",
                    "semester",
                ],
                name="unique_student_academic_enrollment",
            ),
        ]

    def __str__(self):
        return (
            f"{self.student.student_id} - "
            f"{self.academic_year.name} - "
            f"Semester {self.semester.number}"
        )