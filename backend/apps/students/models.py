from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
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

class CourseOfferingEnrollment(TimeStampedModel):
    """Links a semester-level student enrollment to a specific course offering."""

    class Status(models.TextChoices):
        ENROLLED = "ENROLLED", "Enrolled"
        DROPPED = "DROPPED", "Dropped"
        COMPLETED = "COMPLETED", "Completed"

    student_enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.PROTECT,
        related_name="course_offering_enrollments",
    )
    offering = models.ForeignKey(
        "academics.CourseOffering",
        on_delete=models.PROTECT,
        related_name="student_enrollments",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ENROLLED,
    )
    enrolled_date = models.DateField()

    class Meta:
        ordering = ["student_enrollment__student__student_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["student_enrollment", "offering"],
                name="unique_student_enrollment_course_offering",
            ),
        ]

    def clean(self):
        if self.student_enrollment_id and self.offering_id:
            enrollment = self.student_enrollment
            offering = self.offering

            if enrollment.status != Enrollment.Status.ACTIVE:
                raise DjangoValidationError({
                    "student_enrollment": "Only an active semester enrollment can receive a course offering."
                })

            if enrollment.student.status != Student.Status.ACTIVE:
                raise DjangoValidationError({
                    "student_enrollment": "Only active students can be enrolled in a course offering."
                })

            if not offering.is_active:
                raise DjangoValidationError({
                    "offering": "Course offering must be active."
                })

            if offering.status in {"CLOSED", "CANCELLED"}:
                raise DjangoValidationError({
                    "offering": "Students cannot be enrolled in a closed or cancelled course offering."
                })

            if offering.status not in {"PLANNED", "OPEN"}:
                raise DjangoValidationError({
                    "offering": "Students can only be enrolled in planned or open course offerings."
                })

            if enrollment.academic_year_id != offering.academic_year_id:
                raise DjangoValidationError({
                    "offering": "Course offering academic year must match the student's enrollment."
                })
            if enrollment.semester_id != offering.semester_id:
                raise DjangoValidationError({
                    "offering": "Course offering semester must match the student's enrollment."
                })
            if enrollment.student.program_id != offering.semester.program_id:
                raise DjangoValidationError({
                    "offering": "Course offering must belong to the student's program."
                })

            if self.status == self.Status.ENROLLED:
                enrolled_count = (
                    CourseOfferingEnrollment.objects
                    .filter(
                        offering=offering,
                        status=self.Status.ENROLLED,
                    )
                    .exclude(pk=self.pk)
                    .count()
                )
                if enrolled_count >= offering.capacity:
                    raise DjangoValidationError({
                        "offering": "Course offering capacity has been reached."
                    })

    def __str__(self):
        return f"{self.student_enrollment.student.student_id} - {self.offering.course.code} - {self.offering.section}"
