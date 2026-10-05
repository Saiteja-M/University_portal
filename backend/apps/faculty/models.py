from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.academics.models import Department
from apps.common.models import TimeStampedModel


class Faculty(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        ON_LEAVE = "ON_LEAVE", "On Leave"
        RETIRED = "RETIRED", "Retired"
        RESIGNED = "RESIGNED", "Resigned"

    class EmploymentType(models.TextChoices):
        PERMANENT = "PERMANENT", "Permanent"
        CONTRACT = "CONTRACT", "Contract"
        GUEST = "GUEST", "Guest"
        VISITING = "VISITING", "Visiting"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="faculty",
        null=True,
        blank=True,
    )

    faculty_id = models.CharField(
    max_length=30,
    unique=True,
)
    employee_id = models.CharField(
        max_length=50,
        unique=True,
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="faculty_members",
    )

    designation = models.CharField(
        max_length=100,
    )

    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.PERMANENT,
    )

    joining_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    class Meta:
        ordering = ["faculty_id"]

    def __str__(self):
        return f"{self.faculty_id} - {self.employee_id}"


class FacultyProfile(TimeStampedModel):
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

    faculty = models.OneToOneField(
        Faculty,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    photo = models.ImageField(
    upload_to="faculty/photos/",
    blank=True,
    null=True,
)

    first_name = models.CharField(
    max_length=100,
    blank=True,
    null=True,
)

    last_name = models.CharField(
    max_length=100,
    blank=True,
    null=True,
)

    date_of_birth = models.DateField()

    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
    )

    blood_group = models.CharField(
    max_length=10,
    choices=BloodGroup.choices,
    blank=True,
    null=True,
)

    phone_number = models.CharField(
        max_length=20,
    )

    alternate_phone_number = models.CharField(
        max_length=20,
        blank=True,
    )

    institutional_email = models.EmailField(
    unique=True,
    blank=True,
    null=True,
)

    personal_email = models.EmailField(

    blank=True,
    null=True,
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

    photo = models.ImageField(
        upload_to="faculty/photos/",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["first_name", "last_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()


class FacultyQualification(TimeStampedModel):
    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.CASCADE,
        related_name="qualifications",
    )

    degree = models.CharField(
        max_length=150,
    )

    specialization = models.CharField(
        max_length=200,
        blank=True,
    )

    institution = models.CharField(
        max_length=200,
    )

    university = models.CharField(
        max_length=200,
        blank=True,
    )

    year_of_passing = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1950),
            MaxValueValidator(2100),
        ],
    )

    grade_or_percentage = models.CharField(
        max_length=50,
        blank=True,
    )

    class Meta:
        ordering = ["-year_of_passing"]

    def __str__(self):
        return f"{self.faculty.faculty_id} - {self.degree}"


class FacultyExperience(TimeStampedModel):
    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.CASCADE,
        related_name="experiences",
    )

    organization = models.CharField(
        max_length=200,
    )

    designation = models.CharField(
        max_length=100,
    )

    start_date = models.DateField()

    end_date = models.DateField(
        null=True,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return (
            f"{self.faculty.faculty_id} - "
            f"{self.organization}"
        )
class FacultyCourseAssignment(TimeStampedModel):
    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.CASCADE,
        related_name="course_assignments",
    )

    offering = models.ForeignKey(
        "academics.CourseOffering",
        on_delete=models.PROTECT,
        related_name="faculty_assignments",
    )

    assigned_date = models.DateField()

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-assigned_date", "faculty", "offering"]
        constraints = [
            models.UniqueConstraint(
                fields=["faculty", "offering"],
                name="unique_faculty_course_offering_assignment",
            )
        ]

    def clean(self):
        if self.offering_id and self.faculty_id:
            if not self.offering.is_active:
                raise ValidationError({"offering": "The selected course offering is inactive."})
            if self.offering.status in {"CLOSED", "CANCELLED"}:
                raise ValidationError({"offering": "Closed or cancelled course offerings cannot receive faculty assignments."})

    def __str__(self):
        return (
            f"{self.faculty.faculty_id} - "
            f"{self.offering.course.code} - "
            f"{self.offering.academic_year.name}"
        )
