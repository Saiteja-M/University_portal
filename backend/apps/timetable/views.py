from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.common.permissions import IsAcademicsManager, IsAcademicsViewer
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
