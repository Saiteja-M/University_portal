from django.db.models import Subquery
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.academics.models import CourseOffering
from apps.faculty.models import FacultyCourseAssignment
from apps.students.models import CourseOfferingEnrollment
from apps.academics.permissions import IsAcademicsManager, IsAcademicsViewer
from .models import TimetableSlot
from .serializers import TimetableSlotSerializer


class TimetableSlotViewSet(viewsets.ModelViewSet):
    queryset = TimetableSlot.objects.select_related(
        "offering__course", "offering__academic_year", "offering__semester__program",
        "faculty__profile"
    ).all()
    serializer_class = TimetableSlotSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["offering", "faculty", "day_of_week", "period", "is_active"]
    search_fields = ["offering__course__code", "offering__course__name", "offering__section", "room", "building", "faculty__faculty_id"]
    ordering_fields = ["day_of_week", "period", "start_time", "room"]
    ordering = ["day_of_week", "period", "start_time"]

    def get_permissions(self):
        if self.request.method in {"GET", "HEAD", "OPTIONS"}:
            return [IsAcademicsViewer()]
        return [IsAcademicsManager()]


class MyFacultyTimetableViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TimetableSlotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["day_of_week", "period", "is_active"]
    search_fields = ["offering__course__code", "offering__course__name", "offering__section", "room", "building"]
    ordering_fields = ["day_of_week", "period", "start_time"]
    ordering = ["day_of_week", "period", "start_time"]

    def get_queryset(self):
        faculty = getattr(self.request.user, "faculty", None)
        if faculty is None:
            return TimetableSlot.objects.none()
        return TimetableSlot.objects.select_related(
            "offering__course", "offering__academic_year", "offering__semester__program", "faculty__profile"
        ).filter(faculty=faculty, is_active=True, offering__is_active=True)


class MyStudentTimetableViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TimetableSlotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["day_of_week", "period", "is_active"]
    search_fields = ["offering__course__code", "offering__course__name", "offering__section", "room", "building", "faculty__faculty_id"]
    ordering_fields = ["day_of_week", "period", "start_time"]
    ordering = ["day_of_week", "period", "start_time"]

    def get_queryset(self):
        student = getattr(self.request.user, "student", None)
        if student is None:
            return TimetableSlot.objects.none()
        enrolled_offerings = CourseOfferingEnrollment.objects.filter(
            student_enrollment__student=student,
            student_enrollment__status="ACTIVE",
            status=CourseOfferingEnrollment.Status.ENROLLED,
            offering__is_active=True,
            offering__status__in=["PLANNED", "OPEN"],
        ).values("offering_id")
        return TimetableSlot.objects.select_related(
            "offering__course", "offering__academic_year", "offering__semester__program", "faculty__profile"
        ).filter(offering_id__in=Subquery(enrolled_offerings), is_active=True)
