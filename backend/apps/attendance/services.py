from django.db import transaction
from django.db.models import Count, Q
from rest_framework.exceptions import ValidationError

from apps.students.models import Student, CourseOfferingEnrollment

from .models import AttendanceRecord, AttendanceSession


@transaction.atomic
def mark_attendance(
    *,
    session: AttendanceSession,
    attendance_data: list[dict],
):
    """
    Create or update attendance records for a session.

    attendance_data format:

    [
        {
            "student_id": 1,
            "status": "PRESENT",
            "remarks": "",
        },
        ...
    ]
    """

    if not attendance_data:
        raise ValidationError(
            "Attendance data cannot be empty."
        )

    session = (
        AttendanceSession.objects
        .select_for_update()
        .select_related(
            "faculty",
            "course",
            "academic_year",
            "semester",
            "offering",
        )
        .get(pk=session.pk)
    )

    student_ids = [
        item.get("student_id")
        for item in attendance_data
    ]

    if any(
        student_id is None
        for student_id in student_ids
    ):
        raise ValidationError(
            "Every attendance entry must contain student_id."
        )

    if len(student_ids) != len(set(student_ids)):
        raise ValidationError(
            "A student cannot appear more than once "
            "in the same attendance submission."
        )

    valid_statuses = {
        choice[0]
        for choice in AttendanceRecord.Status.choices
    }

    for item in attendance_data:
        if item.get("status") not in valid_statuses:
            raise ValidationError(
                f"Invalid attendance status: "
                f"{item.get('status')}."
            )

    results = []

    for item in attendance_data:
        student_id = item["student_id"]
        status_value = item["status"]
        remarks = item.get("remarks", "")

        if session.offering_id:
            if not CourseOfferingEnrollment.objects.filter(
                student_enrollment__student_id=student_id,
                offering_id=session.offering_id,
                status=CourseOfferingEnrollment.Status.ENROLLED,
                student_enrollment__status="ACTIVE",
            ).exists():
                raise ValidationError(
                    "The student is not enrolled in this course offering."
                )

        existing = (
            AttendanceRecord.objects
            .filter(
                session=session,
                student_id=student_id,
            )
            .first()
        )

        if existing:
            # Update existing attendance record.
            existing.status = status_value
            existing.remarks = remarks

            # Validate enrollment and other model rules.
            existing.full_clean()

            existing.save(
                update_fields=[
                    "status",
                    "remarks",
                    "marked_at",
                ]
            )

            results.append(existing)

        else:
            # Create a new attendance record.
            record = AttendanceRecord(
                session=session,
                student_id=student_id,
                status=status_value,
                remarks=remarks,
            )

            # Validate before saving.
            record.full_clean()

            record.save()

            results.append(record)

    return results


def get_session_summary(
    session: AttendanceSession,
):
    """
    Return attendance statistics for a session.
    """

    summary = session.records.aggregate(
        total=Count("id"),
        present=Count(
            "id",
            filter=Q(
                status=AttendanceRecord.Status.PRESENT
            ),
        ),
        absent=Count(
            "id",
            filter=Q(
                status=AttendanceRecord.Status.ABSENT
            ),
        ),
        late=Count(
            "id",
            filter=Q(
                status=AttendanceRecord.Status.LATE
            ),
        ),
    )

    total = summary["total"] or 0
    present = summary["present"] or 0
    absent = summary["absent"] or 0
    late = summary["late"] or 0

    attendance_percentage = (
        round(
            ((present + late) / total) * 100,
            2,
        )
        if total
        else 0
    )

    return {
        "total": total,
        "present": present,
        "absent": absent,
        "late": late,
        "attendance_percentage": attendance_percentage,
    }


def get_enrolled_students(
    *,
    academic_year_id: int,
    semester_id: int,
):
    """
    Return active students who are actively enrolled
    in the selected academic year and semester.
    """

    return (
        Student.objects
        .select_related(
            "user",
            "program",
        )
        .filter(
            enrollments__academic_year_id=academic_year_id,
            enrollments__semester_id=semester_id,
            enrollments__status=(
                "ACTIVE"
            ),
            status=Student.Status.ACTIVE,
        )
        .distinct()
        .order_by("student_id")
    )