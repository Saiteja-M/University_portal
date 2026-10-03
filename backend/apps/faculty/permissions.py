from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsFacultyViewer(BasePermission):
    message = "You do not have permission to view faculty records."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        return user.groups.filter(
            name__in=["ADMIN", "HOD", "FACULTY"]
        ).exists()


class IsFacultyManager(BasePermission):
    message = "Only administrators can manage faculty records."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        return user.groups.filter(name="ADMIN").exists()


class FacultyAccessPermission(BasePermission):
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return IsFacultyViewer().has_permission(request, view)

        return IsFacultyManager().has_permission(request, view)