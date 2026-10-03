from rest_framework.permissions import BasePermission


class IsStudentViewer(BasePermission):
    """
    Allows authenticated university users who are permitted
    to view student information.
    """

    allowed_roles = {
        "ADMIN",
        "HOD",
        "FACULTY",
    }

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.groups.filter(
            name__in=self.allowed_roles
        ).exists()
from rest_framework.permissions import BasePermission


class IsAuthenticatedStudent(BasePermission):
    """
    Allows access only to a registered student whose
    authenticated User is linked to a Student record.
    """

    message = "Only registered students can access this resource."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if not hasattr(user, "student"):
            return False

        student = user.student

        if student.status != student.Status.ACTIVE:
            return False

        return True


class IsStudentManager(BasePermission):
    """
    Allows administrators and HODs to manage student records.
    """

    allowed_roles = {
        "ADMIN",
        "HOD",
    }

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.groups.filter(
            name__in=self.allowed_roles
        ).exists()


class IsStudentOwnerOrViewer(BasePermission):
    """
    Allows university viewers to access student information.

    Student self-service restrictions will be added when the
    student-facing endpoints are implemented.
    """

    allowed_roles = {
        "ADMIN",
        "HOD",
        "FACULTY",
    }

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        if request.user.groups.filter(
            name__in=self.allowed_roles
        ).exists():
            return True

        return hasattr(request.user, "student")