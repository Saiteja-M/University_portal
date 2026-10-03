from rest_framework.permissions import BasePermission

from apps.accounts.models import UserProfile


class IsAttendanceViewer(BasePermission):
    """
    Users allowed to view attendance.

    ADMIN
    HOD
    FACULTY
    STUDENT
    """

    allowed_roles = {
        UserProfile.UserType.ADMIN,
        "HOD",
        UserProfile.UserType.FACULTY,
        UserProfile.UserType.STUDENT,
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        if not profile:
            return False

        return profile.user_type in self.allowed_roles


class IsAttendanceManager(BasePermission):
    """
    Users allowed to create/update/delete attendance.

    ADMIN
    HOD
    FACULTY
    """

    allowed_roles = {
        UserProfile.UserType.ADMIN,
        "HOD",
        UserProfile.UserType.FACULTY,
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, "profile", None)

        if not profile:
            return False

        return profile.user_type in self.allowed_roles