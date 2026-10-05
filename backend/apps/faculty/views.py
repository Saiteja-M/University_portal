from rest_framework import viewsets

from .models import (
    Faculty,
    FacultyProfile,
    FacultyQualification,
    FacultyExperience,
    FacultyCourseAssignment,
)

from .serializers import (
    FacultySerializer,
    FacultyProfileSerializer,
    FacultyQualificationSerializer,
    FacultyExperienceSerializer,
    FacultyCourseAssignmentSerializer,
)

from .permissions import FacultyAccessPermission


class FacultyViewSet(viewsets.ModelViewSet):
    queryset = (
        Faculty.objects
        .select_related(
            "department",
            "user",
            "profile",
        )
        .prefetch_related(
            "qualifications",
            "experiences",
        )
    )

    serializer_class = FacultySerializer
    permission_classes = [FacultyAccessPermission]


class FacultyProfileViewSet(viewsets.ModelViewSet):
    queryset = FacultyProfile.objects.select_related("faculty")
    serializer_class = FacultyProfileSerializer
    permission_classes = [FacultyAccessPermission]


class FacultyQualificationViewSet(viewsets.ModelViewSet):
    queryset = FacultyQualification.objects.select_related("faculty")
    serializer_class = FacultyQualificationSerializer
    permission_classes = [FacultyAccessPermission]


class FacultyExperienceViewSet(viewsets.ModelViewSet):
    queryset = FacultyExperience.objects.select_related("faculty")
    serializer_class = FacultyExperienceSerializer
    permission_classes = [FacultyAccessPermission]


class FacultyCourseAssignmentViewSet(viewsets.ModelViewSet):
    queryset = (
        FacultyCourseAssignment.objects
        .select_related(
            "faculty",
            "faculty__profile",
            "offering",
            "offering__course",
            "offering__academic_year",
            "offering__semester",
            "offering__semester__program",
        )
    )

    serializer_class = FacultyCourseAssignmentSerializer
    permission_classes = [FacultyAccessPermission]
er
    permission_classes = [FacultyAccessPermission]