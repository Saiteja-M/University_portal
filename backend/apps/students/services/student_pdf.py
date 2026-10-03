from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def _display(value):
    if value is None:
        return "Not provided"

    value = str(value).strip()

    return value if value else "Not provided"


def _format_date(value):
    if not value:
        return "Not provided"

    return value.strftime("%d %b %Y")


def generate_student_profile_pdf(student):
    """
    Generate a complete administrative student profile PDF.

    This document contains:
    - Student identity
    - Academic information
    - Personal/contact information
    - Guardian information
    - Enrollment history

    Authentication credentials/passwords are never included.
    """

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=f"Student Profile - {student.student_id}",
        author="University Portal",
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "UniversityTitle",
        parent=styles["Title"],
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "UniversitySubtitle",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#64748b"),
        alignment=TA_CENTER,
        spaceAfter=14,
    )

    section_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=7,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
    )

    story = []

    # ---------------------------------------------------------
    # HEADER
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "UNIVERSITY STUDENT PROFILE",
            title_style,
        )
    )

    story.append(
        Paragraph(
            "Official Administrative Record",
            subtitle_style,
        )
    )

    # ---------------------------------------------------------
    # PHOTO
    # ---------------------------------------------------------

    profile = getattr(student, "profile", None)

    if profile and getattr(profile, "photo", None):
        try:
            photo = Image(
                profile.photo.path,
                width=32 * mm,
                height=40 * mm,
            )

            photo.hAlign = "LEFT"

            story.append(photo)
            story.append(Spacer(1, 5 * mm))

        except (OSError, ValueError):
            pass

    # ---------------------------------------------------------
    # STUDENT INFORMATION
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "Student Information",
            section_style,
        )
    )

    first_name = getattr(student, "first_name", "")
    last_name = getattr(student, "last_name", "")

    full_name = f"{first_name} {last_name}".strip()

    if not full_name and getattr(student, "user", None):
        full_name = student.user.get_full_name().strip()

    student_rows = [
        ["Student ID", _display(student.student_id)],
        ["Admission Number", _display(student.admission_number)],
        ["Full Name", _display(full_name)],
        ["Program", _display(student.program)],
        ["Department", _display(getattr(student.program, "department", None))],
        ["Admission Date", _format_date(student.admission_date)],
        ["Student Status", _display(student.get_status_display())],
    ]

    story.append(
        _build_two_column_table(student_rows)
    )

    # ---------------------------------------------------------
    # CURRENT ENROLLMENT
    # ---------------------------------------------------------

    current_enrollment = getattr(
        student,
        "current_enrollment",
        None,
    )

    if current_enrollment:
        story.append(
            Paragraph(
                "Current Academic Enrollment",
                section_style,
            )
        )

        enrollment_rows = [
            [
                "Academic Year",
                _display(
                    getattr(
                        current_enrollment,
                        "academic_year_name",
                        None,
                    )
                ),
            ],
            [
                "Semester",
                _display(
                    getattr(
                        current_enrollment,
                        "semester_number",
                        None,
                    )
                ),
            ],
            [
                "Year of Study",
                _display(
                    getattr(
                        current_enrollment,
                        "year_of_study",
                        None,
                    )
                ),
            ],
            [
                "Enrollment Status",
                _display(
                    getattr(
                        current_enrollment,
                        "status",
                        None,
                    )
                ),
            ],
            [
                "Enrollment Date",
                _format_date(
                    getattr(
                        current_enrollment,
                        "enrollment_date",
                        None,
                    )
                ),
            ],
        ]

        story.append(
            _build_two_column_table(enrollment_rows)
        )

    # ---------------------------------------------------------
    # PERSONAL INFORMATION
    # ---------------------------------------------------------

    if profile:
        story.append(
            Paragraph(
                "Personal & Contact Information",
                section_style,
            )
        )

        profile_rows = [
            [
                "Date of Birth",
                _format_date(profile.date_of_birth),
            ],
            [
                "Gender",
                _display(profile.get_gender_display()),
            ],
            [
                "Blood Group",
                _display(profile.blood_group),
            ],
            [
                "Phone Number",
                _display(profile.phone_number),
            ],
            [
                "Institutional Email",
                _display(profile.institutional_email),
            ],
            [
                "Alternate Phone",
                _display(profile.alternate_phone_number),
            ],
            [
                "Address",
                _display(profile.address),
            ],
            [
                "City",
                _display(profile.city),
            ],
            [
                "State",
                _display(profile.state),
            ],
            [
                "Postal Code",
                _display(profile.postal_code),
            ],
        ]

        story.append(
            _build_two_column_table(profile_rows)
        )

    # ---------------------------------------------------------
    # GUARDIANS
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "Guardian Information",
            section_style,
        )
    )

    guardian_rows = [
        [
            "Name",
            "Relationship",
            "Phone",
            "Email",
        ]
    ]

    for guardian in student.guardians.all():
        guardian_rows.append(
            [
                _display(guardian.name),
                _display(guardian.get_relationship_display()),
                _display(guardian.phone_number),
                _display(guardian.email),
            ]
        )

    if len(guardian_rows) == 1:
        guardian_rows.append(
            [
                "No guardian records",
                "-",
                "-",
                "-",
            ]
        )

    guardian_table = Table(
        guardian_rows,
        colWidths=[
            43 * mm,
            36 * mm,
            38 * mm,
            58 * mm,
        ],
        repeatRows=1,
    )

    guardian_table.setStyle(
        TableStyle(
            [
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#f1f5f9"),
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    story.append(guardian_table)

    # ---------------------------------------------------------
    # ENROLLMENT HISTORY
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "Enrollment History",
            section_style,
        )
    )

    enrollment_history_rows = [
        [
            "Academic Year",
            "Semester",
            "Year",
            "Status",
            "Enrollment Date",
        ]
    ]

    for enrollment in student.enrollments.select_related(
        "academic_year",
        "semester",
    ).all():
        enrollment_history_rows.append(
            [
                _display(enrollment.academic_year),
                _display(enrollment.semester.number),
                _display(
                    (
                        enrollment.semester.number + 1
                    ) // 2
                ),
                _display(enrollment.get_status_display()),
                _format_date(enrollment.enrollment_date),
            ]
        )

    if len(enrollment_history_rows) == 1:
        enrollment_history_rows.append(
            [
                "No enrollment records",
                "-",
                "-",
                "-",
                "-",
            ]
        )

    history_table = Table(
        enrollment_history_rows,
        colWidths=[
            40 * mm,
            25 * mm,
            25 * mm,
            35 * mm,
            50 * mm,
        ],
        repeatRows=1,
    )

    history_table.setStyle(
        TableStyle(
            [
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor("#f1f5f9"),
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
            ]
        )
    )

    story.append(history_table)

    story.append(Spacer(1, 12))

    story.append(
        Paragraph(
            "This document is an administrative university record. "
            "Authentication credentials and passwords are never included.",
            ParagraphStyle(
                "Footer",
                parent=body_style,
                fontSize=8,
                textColor=colors.HexColor("#64748b"),
            ),
        )
    )

    document.build(story)

    buffer.seek(0)

    return buffer


def _build_two_column_table(rows):
    table = Table(
        rows,
        colWidths=[
            50 * mm,
            125 * mm,
        ],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor("#cbd5e1"),
                ),
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.HexColor("#f8fafc"),
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    9,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    return table