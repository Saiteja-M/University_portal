from django.contrib.auth.models import User
from django.db import models
from django.conf import settings

from apps.common.models import TimeStampedModel


class UserProfile(TimeStampedModel):
    """
    Additional university-specific information associated
    with a Django authentication user.
    """

    class UserType(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        FACULTY = "FACULTY", "Faculty"
        STAFF = "STAFF", "Staff"
        ADMIN = "ADMIN", "Administrator"

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
    )

    phone_number = models.CharField(
        max_length=20,
        blank=True,
    )

    employee_or_student_id = models.CharField(
        max_length=50,
        blank=True,
    )

    is_student_registered = models.BooleanField(
        default=False,
    )

def __str__(self):
    if self.student_id:
        identity = self.student.student_id
    elif self.user_id:
        identity = self.user.username
    else:
        identity = "Unknown"

    return (
        f"{identity} - "
        f"{self.get_purpose_display()}"
    )


class OTPRecord(TimeStampedModel):
    """
    Stores a hashed OTP challenge for student registration
    and password-reset workflows.

    The actual OTP is never stored in the database.
    """

    class Purpose(models.TextChoices):
        REGISTRATION = "REGISTRATION", "Registration"
        PASSWORD_RESET = "PASSWORD_RESET", "Password Reset"

    class Channel(models.TextChoices):
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"

    student = models.ForeignKey(
    "students.Student",
    on_delete=models.CASCADE,
    related_name="otp_records",
    null=True,
    blank=True,
)

    user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="otp_records",
    null=True,
    blank=True,
)
    purpose = models.CharField(
        max_length=30,
        choices=Purpose.choices,
    )

    channel = models.CharField(
        max_length=10,
        choices=Channel.choices,
    )

    destination = models.CharField(
        max_length=255,
    )

    otp_hash = models.CharField(
        max_length=128,
    )

    attempt_count = models.PositiveSmallIntegerField(
        default=0,
    )

    expires_at = models.DateTimeField()

    used_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    challenge_token_hash = models.CharField(
        max_length=128,
        blank=True,
    )

    challenge_expires_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return (
            f"{self.student.student_id} - "
            f"{self.get_purpose_display()}"
        )