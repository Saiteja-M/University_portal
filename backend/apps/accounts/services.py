from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction
from django.utils import timezone
from apps.faculty.models import Faculty
from apps.students.models import Student

from .models import OTPRecord, UserProfile
from .otp import (
    create_otp_record,
    hash_value,
    verify_otp,
)


User = get_user_model()


UNIVERSITY_ROLES = {
    "STUDENT": "Student",
    "FACULTY": "Faculty",
    "HOD": "Head of Department",
    "ADMIN": "Administrator",
    "ACCOUNTANT": "Accountant",
    "LIBRARIAN": "Librarian",
    "PLACEMENT_OFFICER": "Placement Officer",
    "HOSTEL_WARDEN": "Hostel Warden",
    "TRANSPORT_MANAGER": "Transport Manager",
}


def create_university_roles():
    """
    Create the standard university RBAC groups if they do not exist.
    """

    created_roles = []

    for role_code in UNIVERSITY_ROLES:
        group, created = Group.objects.get_or_create(
            name=role_code,
        )

        if created:
            created_roles.append(group.name)

    return created_roles


def get_current_enrollment(student):
    """
    Return the student's latest active enrollment.
    """

    return (
        student.enrollments
        .select_related(
            "academic_year",
            "semester",
            "semester__program",
        )
        .filter(
            status="ACTIVE",
        )
        .order_by(
            "-academic_year__start_date",
            "-semester__number",
        )
        .first()
    )


def get_student_registration_identity(
    *,
    student_id,
    mobile_number,
    email,
    study_year,
    program_id,
    academic_year_id,
):
    """
    Verify university-controlled student identity information.

    Important:
    A student does NOT need a Django User account before registration.
    The official identity data comes from Student, StudentProfile,
    and the student's active Enrollment.
    """

    try:
        student = (
            Student.objects
            .select_related(
                "program",
                "program__department",
                "profile",
                "user",
            )
            .get(
                student_id=student_id.strip(),
                status=Student.Status.ACTIVE,
            )
        )
    except Student.DoesNotExist:
        raise ValueError(
            "Student registration details could not be verified."
        )

    # ---------------------------------------------------------
    # Already registered?
    # ---------------------------------------------------------

    if student.user_id:
        raise ValueError(
            "This student account is already registered."
        )

    # ---------------------------------------------------------
    # Student profile must exist.
    # ---------------------------------------------------------

    student_profile = getattr(
        student,
        "profile",
        None,
    )

    if not student_profile:
        raise ValueError(
            "Student profile is incomplete. "
            "Please contact the university."
        )

    # ---------------------------------------------------------
    # Verify registered mobile number.
    # ---------------------------------------------------------

    registered_mobile = (
        student_profile.phone_number or ""
    ).strip()

    supplied_mobile = mobile_number.strip()

    if not registered_mobile:
        raise ValueError(
            "No registered mobile number is available for this student."
        )

    if registered_mobile != supplied_mobile:
        raise ValueError(
            "Mobile number does not match university records."
        )

    # ---------------------------------------------------------
    # Verify institutional email.
    # ---------------------------------------------------------

    registered_email = (
        student_profile.institutional_email or ""
    ).strip().lower()

    supplied_email = email.strip().lower()

    if not registered_email:
        raise ValueError(
            "No registered institutional email is available for this student."
        )

    if registered_email != supplied_email:
        raise ValueError(
            "Email does not match university records."
        )

    # ---------------------------------------------------------
    # Verify programme.
    # ---------------------------------------------------------

    if student.program_id != program_id:
        raise ValueError(
            "Programme does not match university records."
        )

    # ---------------------------------------------------------
    # Verify current active enrollment.
    # ---------------------------------------------------------

    enrollment = get_current_enrollment(student)

    if not enrollment:
        raise ValueError(
            "No active enrollment was found."
        )

    # ---------------------------------------------------------
    # Derive study year from semester.
    #
    # Semester 1/2 -> Year 1
    # Semester 3/4 -> Year 2
    # Semester 5/6 -> Year 3
    # Semester 7/8 -> Year 4
    # ---------------------------------------------------------

    calculated_year = (
        enrollment.semester.number + 1
    ) // 2

    if calculated_year != study_year:
        raise ValueError(
            "Study year does not match current enrollment."
        )

    # ---------------------------------------------------------
    # Verify academic year.
    # ---------------------------------------------------------

    if enrollment.academic_year_id != academic_year_id:
        raise ValueError(
            "Academic year does not match current enrollment."
        )

    # ---------------------------------------------------------
    # Verify enrollment programme.
    # ---------------------------------------------------------

    if enrollment.semester.program_id != program_id:
        raise ValueError(
            "Enrollment programme does not match student programme."
        )

    return student, enrollment


@transaction.atomic
def start_student_registration(
    *,
    student_id,
    mobile_number,
    email,
    study_year,
    program_id,
    academic_year_id,
):
    """
    Verify the student and issue a registration OTP.
    """

    student, _ = get_student_registration_identity(
        student_id=student_id,
        mobile_number=mobile_number,
        email=email,
        study_year=study_year,
        program_id=program_id,
        academic_year_id=academic_year_id,
    )

    student_profile = getattr(
        student,
        "profile",
        None,
    )

    if not student_profile:
        raise ValueError(
            "Student profile is not configured. Please contact the university administration."
        )

    destination = (
        student_profile.institutional_email or ""
    ).strip().lower()

    if not destination:
        raise ValueError(
            "No institutional email is registered for this student. Please contact the university administration."
        )

    record, challenge_token = create_otp_record(
        student=student,
        purpose=OTPRecord.Purpose.REGISTRATION,
        channel=OTPRecord.Channel.EMAIL,
        destination=destination,
    )

    return {
        "registration_token": challenge_token,
        "expires_at": record.challenge_expires_at,
        "otp_expires_at": record.expires_at,
        "student_id": student.student_id,
    }

@transaction.atomic
def complete_student_registration(
    *,
    registration_token,
    otp,
    password,
    password_confirm,
):
    """
    Verify registration OTP and create the student's portal account.

    The Django User is intentionally created only after successful
    OTP verification.
    """

    if password != password_confirm:
        raise ValueError(
            "Passwords do not match."
        )

    token_hash = hash_value(
        registration_token,
    )

    record = (
        OTPRecord.objects
        .select_related(
            "student",
            "student__profile",
            "student__program",
        )
        .filter(
            purpose=OTPRecord.Purpose.REGISTRATION,
            channel=OTPRecord.Channel.EMAIL,
            challenge_token_hash=token_hash,
            used_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )

    if not record:
        raise ValueError(
            "Invalid or expired registration token."
        )

    if (
        not record.challenge_expires_at
        or timezone.now() > record.challenge_expires_at
    ):
        raise ValueError(
            "Registration token has expired."
        )

    success, error = verify_otp(
        record,
        otp,
    )

    if not success:
        raise ValueError(error)

    student = record.student

    # ---------------------------------------------------------
    # Prevent duplicate registration.
    # ---------------------------------------------------------

    if student.user_id:
        raise ValueError(
            "This student account is already registered."
        )

    institutional_email = (
        student.profile.institutional_email
        or ""
    ).strip().lower()

    if not institutional_email:
        raise ValueError(
            "Student institutional email is missing."
        )

    # ---------------------------------------------------------
    # Make sure the email is not already used by another User.
    # ---------------------------------------------------------

    if User.objects.filter(
        email__iexact=institutional_email
    ).exists():
        raise ValueError(
            "This institutional email is already associated "
            "with another account."
        )

    # ---------------------------------------------------------
    # Use student ID as the initial username.
    #
    # This keeps the portal identity stable and avoids asking
    # the student to invent a username.
    # ---------------------------------------------------------

    username = student.student_id.strip()

    if User.objects.filter(
        username__iexact=username
    ).exists():
        raise ValueError(
            "A user account with this student ID already exists."
        )

    # ---------------------------------------------------------
    # Create the Django authentication account.
    # ---------------------------------------------------------

    user = User.objects.create_user(
        username=username,
        email=institutional_email,
        password=password,
        is_active=True,
    )

    # ---------------------------------------------------------
    # Copy the student's name if official name information
    # is already available.
    #
    # Student currently stores identity through User, so this
    # is intentionally left blank rather than inventing a name.
    # ---------------------------------------------------------

    # ---------------------------------------------------------
    # Create/update UserProfile.
    # ---------------------------------------------------------

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "user_type": UserProfile.UserType.STUDENT,
            "employee_or_student_id": student.student_id,
            "phone_number": student.profile.phone_number,
            "is_student_registered": True,
        },
    )

    profile.user_type = UserProfile.UserType.STUDENT
    profile.employee_or_student_id = student.student_id
    profile.is_student_registered = True

    if not profile.phone_number:
        profile.phone_number = (
            student.profile.phone_number
        )

    profile.save()

    # ---------------------------------------------------------
    # Add STUDENT RBAC group.
    # ---------------------------------------------------------

    student_group, _ = Group.objects.get_or_create(
        name="STUDENT",
    )

    user.groups.add(student_group)

    # ---------------------------------------------------------
    # Link User -> Student.
    # ---------------------------------------------------------

    student.user = user
    student.save(
        update_fields=[
            "user",
            "updated_at",
        ]
    )

    # ---------------------------------------------------------
    # Mark registration challenge as used.
    # ---------------------------------------------------------

    record.used_at = timezone.now()
    record.save(
        update_fields=[
            "used_at",
            "updated_at",
        ]
    )

    return student


@transaction.atomic
def start_student_password_reset(
    *,
    student_id,
    channel,
):
    """
    Start a student password-reset challenge.

    Password reset is available only after the student has
    completed portal registration.
    """

    try:
        student = (
            Student.objects
            .select_related(
                "user",
                "profile",
            )
            .get(
                student_id=student_id.strip(),
                status=Student.Status.ACTIVE,
            )
        )
    except Student.DoesNotExist:
        raise ValueError(
            "Student password-reset details could not be verified."
        )

    if not student.user_id:
        raise ValueError(
            "Student portal registration has not been completed."
        )

    if channel == OTPRecord.Channel.EMAIL:
        destination = (
            student.user.email or ""
        ).strip().lower()

        if not destination:
            raise ValueError(
                "No registered email is available for this student."
            )

    elif channel == OTPRecord.Channel.SMS:
        destination = (
            student.profile.phone_number or ""
        ).strip()

        if not destination:
            raise ValueError(
                "No registered mobile number is available for this student."
            )

    else:
        raise ValueError(
            "Unsupported password-reset channel."
        )

    record, challenge_token = create_otp_record(
        student=student,
        purpose=OTPRecord.Purpose.PASSWORD_RESET,
        channel=channel,
        destination=destination,
    )

    return {
        "reset_token": challenge_token,
        "student_id": student.student_id,
        "expires_at": record.challenge_expires_at,
        "otp_expires_at": record.expires_at,
    }


@transaction.atomic
def complete_student_password_reset(
    *,
    reset_token,
    otp,
    password,
    password_confirm,
):
    """
    Verify the password-reset OTP and change the student's password.
    """

    if password != password_confirm:
        raise ValueError(
            "Passwords do not match."
        )

    token_hash = hash_value(
        reset_token,
    )

    record = (
        OTPRecord.objects
        .select_related(
            "student",
            "student__user",
        )
        .filter(
            purpose=OTPRecord.Purpose.PASSWORD_RESET,
            challenge_token_hash=token_hash,
            used_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )

    if not record:
        raise ValueError(
            "Invalid or expired password-reset token."
        )

    if (
        not record.challenge_expires_at
        or timezone.now() > record.challenge_expires_at
    ):
        raise ValueError(
            "Password-reset token has expired."
        )

    success, error = verify_otp(
        record,
        otp,
    )

    if not success:
        raise ValueError(error)

    user = record.student.user

    if not user:
        raise ValueError(
            "Student portal registration has not been completed."
        )

    user.set_password(password)
    user.save(
        update_fields=["password"],
    )

    # Invalidate existing DRF authentication tokens.
    from rest_framework.authtoken.models import Token

    Token.objects.filter(
        user=user,
    ).delete()

    record.used_at = timezone.now()
    record.save(
        update_fields=[
            "used_at",
            "updated_at",
        ]
    )

    return record.student
@transaction.atomic
def start_faculty_password_reset(
    *,
    email,
):
    """
    Start a faculty password-reset challenge
    using the registered institutional email.
    """

    email = email.strip().lower()

    try:
        faculty = (
            Faculty.objects
            .select_related(
                "user",
                "profile",
            )
            .get(
                user__email__iexact=email,
                status=Faculty.Status.ACTIVE,
            )
        )
    except Faculty.DoesNotExist:
        raise ValueError(
            "No active faculty account is registered "
            "with this email address."
        )

    if not faculty.user_id:
        raise ValueError(
            "This faculty account is not linked "
            "to a portal user."
        )

    if not faculty.user.is_active:
        raise ValueError(
            "This faculty account is inactive."
        )

    destination = (
        faculty.user.email or ""
    ).strip().lower()

    if not destination:
        raise ValueError(
            "No registered email is available "
            "for this faculty account."
        )

    record, challenge_token = create_otp_record(
        user=faculty.user,
        purpose=OTPRecord.Purpose.PASSWORD_RESET,
        channel=OTPRecord.Channel.EMAIL,
        destination=destination,
    )

    return {
        "reset_token": challenge_token,
        "faculty_id": faculty.id,
        "faculty_code": faculty.faculty_id,
        "expires_at": record.challenge_expires_at,
        "otp_expires_at": record.expires_at,
    }


@transaction.atomic
def complete_faculty_password_reset(
    *,
    reset_token,
    otp,
    password,
    password_confirm,
):
    """
    Verify the faculty password-reset OTP and
    set the new Django authentication password.
    """

    if password != password_confirm:
        raise ValueError(
            "Passwords do not match."
        )

    token_hash = hash_value(
        reset_token,
    )

    record = (
        OTPRecord.objects
        .select_related(
            "user",
            "user__faculty",
        )
        .filter(
            user__faculty__status=Faculty.Status.ACTIVE,
            purpose=OTPRecord.Purpose.PASSWORD_RESET,
            challenge_token_hash=token_hash,
            used_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )

    if not record:
        raise ValueError(
            "Invalid or expired password-reset token."
        )

    if (
        not record.challenge_expires_at
        or timezone.now()
        > record.challenge_expires_at
    ):
        raise ValueError(
            "Password-reset token has expired."
        )

    success, error = verify_otp(
        record,
        otp,
    )

    if not success:
        raise ValueError(error)

    user = record.user

    if not user:
        raise ValueError(
            "Faculty account is not linked "
            "to a portal user."
        )

    faculty = getattr(
        user,
        "faculty",
        None,
    )

    if not faculty:
        raise ValueError(
            "Faculty profile could not be found."
        )

    if faculty.status != Faculty.Status.ACTIVE:
        raise ValueError(
            "This faculty account is inactive."
        )

    user.set_password(password)

    user.save(
        update_fields=[
            "password",
        ],
    )

    # Invalidate existing DRF authentication tokens.
    from rest_framework.authtoken.models import Token

    Token.objects.filter(
        user=user,
    ).delete()

    record.used_at = timezone.now()

    record.save(
        update_fields=[
            "used_at",
            "updated_at",
        ],
    )

    return faculty