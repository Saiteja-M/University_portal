from django.db import transaction

from ..models import (
    Enrollment,
    Guardian,
    Student,
    StudentProfile,
)


@transaction.atomic
def create_student(
    *,
    student_id,
    admission_number,
    program,
    admission_date,
    status=Student.Status.ACTIVE,
    date_of_birth=None,
    gender=None,
    blood_group="",
    phone_number="",
    institutional_email="",
    alternate_phone_number="",
    address="",
    city="",
    state="",
    postal_code="",
):
    """
    Create the official university student record.

    IMPORTANT:
    - This function does NOT create a Django User.
    - The Student record is created first.
    - The student will create their own login account later
      through the student registration/OTP flow.
    """

    student = Student.objects.create(
        user=None,
        student_id=student_id,
        admission_number=admission_number,
        program=program,
        admission_date=admission_date,
        status=status,
    )

    if date_of_birth and gender:
        StudentProfile.objects.create(
            student=student,
            date_of_birth=date_of_birth,
            gender=gender,
            blood_group=blood_group,
            phone_number=phone_number,
            institutional_email=institutional_email,
            alternate_phone_number=alternate_phone_number,
            address=address,
            city=city,
            state=state,
            postal_code=postal_code,
        )

    return student


@transaction.atomic
def update_student(
    student,
    *,
    student_id=None,
    admission_number=None,
    program=None,
    admission_date=None,
    status=None,
):
    """
    Update the Student record inside an atomic transaction.
    """

    if student_id is not None:
        student.student_id = student_id

    if admission_number is not None:
        student.admission_number = admission_number

    if program is not None:
        student.program = program

    if admission_date is not None:
        student.admission_date = admission_date

    if status is not None:
        student.status = status

    student.save()

    return student


@transaction.atomic
def create_student_profile(
    *,
    student,
    date_of_birth,
    gender,
    blood_group="",
    phone_number="",
    institutional_email="",
    alternate_phone_number="",
    address="",
    city="",
    state="",
    postal_code="",
):
    """
    Create a student's personal profile.
    """

    profile = StudentProfile.objects.create(
        student=student,
        date_of_birth=date_of_birth,
        gender=gender,
        blood_group=blood_group,
        phone_number=phone_number,
        institutional_email=institutional_email,
        alternate_phone_number=alternate_phone_number,
        address=address,
        city=city,
        state=state,
        postal_code=postal_code,
    )

    return profile


@transaction.atomic
def update_student_profile(
    profile,
    *,
    date_of_birth=None,
    gender=None,
    blood_group=None,
    phone_number=None,
    institutional_email=None,
    alternate_phone_number=None,
    address=None,
    city=None,
    state=None,
    postal_code=None,
):
    """
    Update an existing StudentProfile.
    """

    if date_of_birth is not None:
        profile.date_of_birth = date_of_birth

    if gender is not None:
        profile.gender = gender

    if blood_group is not None:
        profile.blood_group = blood_group

    if phone_number is not None:
        profile.phone_number = phone_number

    if institutional_email is not None:
        profile.institutional_email = institutional_email.strip().lower()

    if alternate_phone_number is not None:
        profile.alternate_phone_number = alternate_phone_number

    if address is not None:
        profile.address = address

    if city is not None:
        profile.city = city

    if state is not None:
        profile.state = state

    if postal_code is not None:
        profile.postal_code = postal_code

    profile.save()

    return profile


@transaction.atomic
def create_guardian(
    *,
    student,
    name,
    relationship,
    phone_number,
    email="",
    occupation="",
    address="",
):
    """
    Create a guardian for a student.
    """

    guardian = Guardian.objects.create(
        student=student,
        name=name,
        relationship=relationship,
        phone_number=phone_number,
        email=email,
        occupation=occupation,
        address=address,
    )

    return guardian


@transaction.atomic
def update_guardian(
    guardian,
    *,
    name=None,
    relationship=None,
    phone_number=None,
    email=None,
    occupation=None,
    address=None,
):
    """
    Update an existing guardian.
    """

    if name is not None:
        guardian.name = name

    if relationship is not None:
        guardian.relationship = relationship

    if phone_number is not None:
        guardian.phone_number = phone_number

    if email is not None:
        guardian.email = email

    if occupation is not None:
        guardian.occupation = occupation

    if address is not None:
        guardian.address = address

    guardian.save()

    return guardian


@transaction.atomic
def create_enrollment(
    *,
    student,
    academic_year,
    semester,
    enrollment_date,
    status=Enrollment.Status.ACTIVE,
):
    """
    Create an enrollment after validating that the semester
    belongs to the student's program.
    """

    if semester.program_id != student.program_id:
        raise ValueError(
            "Selected semester does not belong "
            "to the student's program."
        )

    enrollment = Enrollment.objects.create(
        student=student,
        academic_year=academic_year,
        semester=semester,
        enrollment_date=enrollment_date,
        status=status,
    )

    return enrollment


@transaction.atomic
def update_enrollment(
    enrollment,
    *,
    academic_year=None,
    semester=None,
    enrollment_date=None,
    status=None,
):
    """
    Update an enrollment while preserving the program/semester
    relationship.
    """

    target_semester = (
        semester
        if semester is not None
        else enrollment.semester
    )

    if target_semester.program_id != enrollment.student.program_id:
        raise ValueError(
            "Selected semester does not belong "
            "to the student's program."
        )

    if academic_year is not None:
        enrollment.academic_year = academic_year

    if semester is not None:
        enrollment.semester = semester

    if enrollment_date is not None:
        enrollment.enrollment_date = enrollment_date

    if status is not None:
        enrollment.status = status

    enrollment.save()

    return enrollment
from django.contrib.auth import get_user_model
from django.db import transaction
from django.core.files.storage import default_storage

from ..models import Student


User = get_user_model()


@transaction.atomic
def permanently_delete_student(student: Student) -> None:
    """
    Permanently delete a student and all student-owned records.

    This operation is intentionally destructive.
    It removes the portal account, student profile,
    guardians, enrollments, student record, and uploaded photo.
    """

    # Capture the related user before removing the relationship.
    user = student.user

    # Capture uploaded photo path before deleting the profile.
    photo_name = None

    try:
        profile = student.profile
        if profile.photo:
            photo_name = profile.photo.name
    except Student.profile.RelatedObjectDoesNotExist:
        profile = None

    # ---------------------------------------------------------
    # 1. Delete enrollments first.
    #    Enrollment.student uses PROTECT.
    # ---------------------------------------------------------
    student.enrollments.all().delete()

    # ---------------------------------------------------------
    # 2. Delete guardians.
    #    Guardian.student uses CASCADE, but we explicitly
    #    delete them to make the operation intentional.
    # ---------------------------------------------------------
    student.guardians.all().delete()

    # ---------------------------------------------------------
    # 3. Delete StudentProfile.
    # ---------------------------------------------------------
    if profile:
        profile.delete()

    # ---------------------------------------------------------
    # 4. Break Student -> User PROTECT relationship.
    # ---------------------------------------------------------
    if user:
        student.user = None
        student.save(update_fields=["user"])

        # -----------------------------------------------------
        # 5. Delete the Django User.
        #    Related UserProfile / Token records using CASCADE
        #    will be removed by Django.
        # -----------------------------------------------------
        user.delete()

    # ---------------------------------------------------------
    # 6. Finally delete the Student itself.
    # ---------------------------------------------------------
    student.delete()

    # ---------------------------------------------------------
    # 7. Delete the physical photo only after the DB
    #    transaction successfully commits.
    # ---------------------------------------------------------
    if photo_name:
        transaction.on_commit(
            lambda: default_storage.delete(photo_name)
        )
