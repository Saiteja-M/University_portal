from django.db import transaction

from ..models import (
    Faculty,
    FacultyProfile,
    FacultyQualification,
    FacultyExperience,
    FacultyCourseAssignment,
)


@transaction.atomic
def create_faculty(validated_data):
    faculty = Faculty(**validated_data)
    faculty.full_clean()
    faculty.save()
    return faculty


@transaction.atomic
def update_faculty(instance, validated_data):
    for field, value in validated_data.items():
        setattr(instance, field, value)

    instance.full_clean()
    instance.save()

    return instance


@transaction.atomic
def create_faculty_profile(validated_data):
    profile = FacultyProfile(**validated_data)
    profile.full_clean()
    profile.save()
    return profile


@transaction.atomic
def update_faculty_profile(instance, validated_data):
    for field, value in validated_data.items():
        setattr(instance, field, value)

    instance.full_clean()
    instance.save()

    return instance


@transaction.atomic
def create_faculty_qualification(validated_data):
    qualification = FacultyQualification(**validated_data)
    qualification.full_clean()
    qualification.save()
    return qualification


@transaction.atomic
def update_faculty_qualification(instance, validated_data):
    for field, value in validated_data.items():
        setattr(instance, field, value)

    instance.full_clean()
    instance.save()

    return instance


@transaction.atomic
def create_faculty_experience(validated_data):
    experience = FacultyExperience(**validated_data)
    experience.full_clean()
    experience.save()
    return experience


@transaction.atomic
def update_faculty_experience(instance, validated_data):
    for field, value in validated_data.items():
        setattr(instance, field, value)

    instance.full_clean()
    instance.save()

    return instance


@transaction.atomic
def create_faculty_course_assignment(validated_data):
    assignment = FacultyCourseAssignment(**validated_data)
    assignment.full_clean()
    assignment.save()
    return assignment


@transaction.atomic
def update_faculty_course_assignment(instance, validated_data):
    for field, value in validated_data.items():
        setattr(instance, field, value)

    instance.full_clean()
    instance.save()

    return instance