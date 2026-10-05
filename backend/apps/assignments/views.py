from rest_framework import viewsets
from rest_framework.permissions import BasePermission

from .models import Assignment, AssignmentSubmission
from .serializers import AssignmentSerializer, AssignmentSubmissionSerializer


class AssignmentAccessPermission(BasePermission):
    message = "You do not have permission to manage assignments."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.groups.filter(name__in={"ADMIN", "HOD"}).exists():
            return True
        if user.groups.filter(name="FACULTY").exists():
            return True
        # Students may only read published assignments.
        return user.groups.filter(name="STUDENT").exists() and request.method in {"GET", "HEAD", "OPTIONS"}


class AssignmentSubmissionAccessPermission(BasePermission):
    message = "You do not have permission to manage assignment submissions."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.groups.filter(name__in={"ADMIN", "HOD", "FACULTY"}).exists():
            return True
        if user.groups.filter(name="STUDENT").exists():
            return True
        return False


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [AssignmentAccessPermission]
    search_fields = ["title", "description", "offering__course__code", "offering__course__name", "offering__section"]
    ordering_fields = ["due_date", "created_at", "title"]
    filterset_fields = ["offering", "status", "is_active"]

    def get_queryset(self):
        user = self.request.user
        qs = Assignment.objects.select_related(
            "offering", "offering__course", "offering__academic_year",
            "offering__semester", "offering__semester__program",
        ).prefetch_related("submissions")

        if user.is_superuser or user.groups.filter(name__in={"ADMIN", "HOD"}).exists():
            return qs

        faculty = getattr(user, "faculty", None)
        if faculty and user.groups.filter(name="FACULTY").exists():
            return qs.filter(
                offering__faculty_assignments__faculty=faculty,
                offering__faculty_assignments__is_active=True,
            ).distinct()

        student = getattr(user, "student", None)
        if student and user.groups.filter(name="STUDENT").exists():
            return qs.filter(
                offering__student_enrollments__student_enrollment__student=student,
                offering__student_enrollments__student_enrollment__status="ACTIVE",
                offering__student_enrollments__status="ENROLLED",
                status=Assignment.Status.PUBLISHED,
                is_active=True,
            ).distinct()

        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_superuser or user.groups.filter(name__in={"ADMIN", "HOD", "FACULTY"}).exists()):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only administrators, HODs, and assigned faculty can create assignments.")
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if user.groups.filter(name="FACULTY").exists() and not user.groups.filter(name__in={"ADMIN", "HOD"}).exists():
            faculty = getattr(user, "faculty", None)
            if not faculty or not serializer.instance.offering.faculty_assignments.filter(
                faculty=faculty, is_active=True
            ).exists():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You are not assigned to this course offering.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.groups.filter(name="FACULTY").exists() and not user.groups.filter(name__in={"ADMIN", "HOD"}).exists():
            faculty = getattr(user, "faculty", None)
            if not faculty or not instance.offering.faculty_assignments.filter(
                faculty=faculty, is_active=True
            ).exists():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You are not assigned to this course offering.")
        instance.delete()


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [AssignmentSubmissionAccessPermission]
    search_fields = ["student__student_id", "assignment__title", "assignment__offering__course__code"]
    ordering_fields = ["submitted_at", "marks"]
    filterset_fields = ["assignment", "student", "status"]

    def get_queryset(self):
        user = self.request.user
        qs = AssignmentSubmission.objects.select_related(
            "assignment", "assignment__offering", "assignment__offering__course",
            "student", "student__user",
        )

        if user.is_superuser or user.groups.filter(name__in={"ADMIN", "HOD"}).exists():
            return qs

        faculty = getattr(user, "faculty", None)
        if faculty and user.groups.filter(name="FACULTY").exists():
            return qs.filter(
                assignment__offering__faculty_assignments__faculty=faculty,
                assignment__offering__faculty_assignments__is_active=True,
            ).distinct()

        student = getattr(user, "student", None)
        if student and user.groups.filter(name="STUDENT").exists():
            return qs.filter(student=student)

        return qs.none()

    def perform_create(self, serializer):
        student = getattr(self.request.user, "student", None)
        if not student or not self.request.user.groups.filter(name="STUDENT").exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only students can create assignment submissions.")
        serializer.save(student=student)
