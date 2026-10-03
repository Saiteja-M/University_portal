from django.db import transaction

from .models import (
    AcademicYear,
    Course,
    Department,
    Program,
    Semester,
)


@transaction.atomic
def create_department(
    *,
    code: str,
    name: str,
    description: str = "",
    is_active: bool = True,
) -> Department:
    return Department.objects.create(
        code=code.strip().upper(),
        name=name.strip(),
        description=description.strip(),
        is_active=is_active,
    )


@transaction.atomic
def create_program(
    *,
    department: Department,
    code: str,
    name: str,
    duration_years: int = 4,
    is_active: bool = True,
) -> Program:
    return Program.objects.create(
        department=department,
        code=code.strip().upper(),
        name=name.strip(),
        duration_years=duration_years,
        is_active=is_active,
    )


@transaction.atomic
def create_academic_year(
    *,
    name: str,
    start_date,
    end_date,
    is_current: bool = False,
) -> AcademicYear:
    if is_current:
        AcademicYear.objects.filter(
            is_current=True
        ).update(is_current=False)

    return AcademicYear.objects.create(
        name=name.strip(),
        start_date=start_date,
        end_date=end_date,
        is_current=is_current,
    )


@transaction.atomic
def create_semester(
    *,
    program: Program,
    academic_year: AcademicYear,
    number: int,
    semester_type: str,
    is_active: bool = True,
) -> Semester:
    return Semester.objects.create(
        program=program,
        academic_year=academic_year,
        number=number,
        semester_type=semester_type,
        is_active=is_active,
    )


@transaction.atomic
def create_course(
    *,
    semester: Semester,
    code: str,
    name: str,
    credits: int = 0,
    is_active: bool = True,
) -> Course:
    return Course.objects.create(
        semester=semester,
        code=code.strip().upper(),
        name=name.strip(),
        credits=credits,
        is_active=is_active,
    )