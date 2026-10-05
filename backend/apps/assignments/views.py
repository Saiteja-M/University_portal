from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Assignment, AssignmentSubmission
from .serializers import AssignmentSerializer, AssignmentSubmissionSerializer


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["title", "description", "offering__course__code", "offering__course__name", "offering__section"]
    ordering_fields = ["due_date", "created_at", "title"]
    filterset_fields = ["offering", "status", "is_active"]

    def get_queryset(self):
        user = self.request.user
        qs = Assignment.objects.select_related("offering", "offering__course", "offering__academic_year", "offering__semester", "offering__semester__program").prefetch_related("submissions")
        if user.is_superuser or user.groups.filter(name__in=["ADMIN", "HOD"]).exists():
            return qs
        faculty = getattr(user, "faculty", None)
        if faculty:
            return qs.filter(offering__faculty_assignments__faculty=faculty, offering__faculty_assignments__is_active=True).distinct()
        student = getattr(user, "student", None)
        if student:
            return qs.filter(offering__student_enrollments__student_enrollment__student=student, offering__student_enrollments__status="ENROLLED", status=Assignment.Status.PUBLISHED, is_active=True).distinct()
        return qs.none()


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["student__student_id", "assignment__title", "assignment__offering__course__code"]
    ordering_fields = ["submitted_at", "marks"]
    filterset_fields = ["assignment", "student", "status"]

    def get_queryset(self):
        user = self.request.user
        qs = AssignmentSubmission.objects.select_related("assignment", "assignment__offering", "assignment__offering__course", "student", "student__user")
        if user.is_superuser or user.groups.filter(name__in=["ADMIN", "HOD"]).exists():
            return qs
        faculty = getattr(user, "faculty", None)
        if faculty:
            return qs.filter(assignment__offering__faculty_assignments__faculty=faculty, assignment__offering__faculty_assignments__is_active=True).distinct()
        student = getattr(user, "student", None)
        if student:
            return qs.filter(student=student)
        return qs.none()

    def perform_create(self, serializer):
        student = getattr(self.request.user, "student", None)
        if not student:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only students can create assignment submissions.")
        serializer.save(student=student)
