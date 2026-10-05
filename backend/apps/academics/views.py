from rest_framework import viewsets
from rest_framework.permissions import SAFE_METHODS

from .models import (
    AcademicYear,
    Course,
    Department,
    Program,
    Regulation,
    Semester,
    CourseOffering,
)

from .permissions import (
    IsAcademicsManager,
    IsAcademicsViewer,
)

from .serializers import (
    AcademicYearSerializer,
    CourseSerializer,
    DepartmentSerializer,
    ProgramSerializer,
    RegulationSerializer,
    SemesterSerializer,
    CourseOfferingSerializer,
)


class AcademicsViewSetMixin:
    """
    Provides role-based access for Academics APIs.
    """

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            permission_class = IsAcademicsViewer
        else:
            permission_class = IsAcademicsManager

        return [permission_class()]


class DepartmentViewSet(
    AcademicsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    search_fields = [
        "code",
        "name",
    ]

    ordering_fields = [
        "code",
        "name",
        "created_at",
    ]

    ordering = ["name"]

    filterset_fields = [
        "is_active",
    ]


class ProgramViewSet(
    AcademicsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = Program.objects.select_related(
        "department",
    )

    serializer_class = ProgramSerializer

    search_fields = [
        "code",
        "name",
        "department__name",
    ]

    ordering_fields = [
        "code",
        "name",
        "duration_years",
        "created_at",
    ]

    ordering = ["name"]

    filterset_fields = [
        "department",
        "is_active",
    ]


class RegulationViewSet(
    AcademicsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = Regulation.objects.select_related(
        "program",
    )

    serializer_class = RegulationSerializer

    search_fields = [
        "code",
        "name",
        "program__name",
        "program__code",
    ]

    ordering_fields = [
        "code",
        "name",
        "start_year",
        "created_at",
    ]

    ordering = [
        "-start_year",
        "code",
    ]

    filterset_fields = [
        "program",
        "is_active",
        "start_year",
    ]


class AcademicYearViewSet(
    AcademicsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer

    search_fields = [
        "name",
    ]

    ordering_fields = [
        "name",
        "start_date",
        "end_date",
        "created_at",
    ]

    ordering = ["-start_date"]

    filterset_fields = [
        "is_current",
    ]


class SemesterViewSet(
    AcademicsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = Semester.objects.select_related(
        "program",
        "academic_year",
    )

    serializer_class = SemesterSerializer

    search_fields = [
        "program__name",
        "program__code",
        "academic_year__name",
    ]

    ordering_fields = [
        "number",
        "created_at",
    ]

    ordering = [
        "program",
        "number",
    ]

    filterset_fields = [
        "program",
        "academic_year",
        "number",
        "semester_type",
        "is_active",
    ]


class CourseViewSet(
    AcademicsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = Course.objects.select_related(
        "semester",
        "semester__program",
        "regulation",
    )

    serializer_class = CourseSerializer

    search_fields = [
        "code",
        "name",
        "semester__program__name",
        "regulation__code",
        "regulation__name",
    ]

    ordering_fields = [
        "code",
        "name",
        "credits",
        "created_at",
    ]

    ordering = ["code"]

    filterset_fields = [
        "semester",
        "semester__program",
        "regulation",
        "credits",
        "is_active",
    ]

class CourseOfferingViewSet(
    AcademicsViewSetMixin,
    viewsets.ModelViewSet,
):
    queryset = CourseOffering.objects.select_related(
        "course",
        "academic_year",
        "semester",
        "semester__program",
    )
    serializer_class = CourseOfferingSerializer

    search_fields = [
        "course__code",
        "course__name",
        "section",
        "academic_year__name",
        "semester__program__name",
    ]

    ordering_fields = [
        "section",
        "capacity",
        "status",
        "created_at",
    ]

    ordering = [
        "-academic_year__start_date",
        "semester__number",
        "course__code",
        "section",
    ]

    filterset_fields = [
        "course",
        "academic_year",
        "semester",
        "semester__program",
        "section",
        "status",
        "is_active",
    ]
