from rest_framework.permissions import BasePermission


class IsExaminationManager(BasePermission):
    """
    Allows administrators and HOD users to manage examinations and results.
    """

    message = "Only administrators and HOD users can manage examinations and results."

    allowed_roles = {"ADMIN", "HOD"}

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or user.is_staff:
            return True

        return user.groups.filter(
            name__in=self.allowed_roles
        ).exists()


class IsAuthenticatedStudent(BasePermission):
    message = "Only authenticated students can access student examination data."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        student = getattr(user, "student", None)
        return student is not None and student.status == student.Status.ACTIVE

class IsFacultyExamViewer(BasePermission):
    message = "Only faculty, HOD and administrators can view faculty examination data."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.groups.filter(name__in={"ADMIN", "HOD"}).exists():
            return True
        return user.groups.filter(name="FACULTY").exists()
