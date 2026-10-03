from rest_framework.permissions import BasePermission


class IsAcademicsAdmin(BasePermission):
    """
    Full Academics access.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser
            or request.user.groups.filter(
                name="ADMIN"
            ).exists()
        )


class IsAcademicsManager(BasePermission):
    """
    Create/update Academics data.
    ADMIN and HOD can manage.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.groups.filter(
            name__in=["ADMIN", "HOD"]
        ).exists()


class IsAcademicsViewer(BasePermission):
    """
    Read-only Academics access.
    ADMIN, HOD, FACULTY and STUDENT can view.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.groups.filter(
            name__in=[
                "ADMIN",
                "HOD",
                "FACULTY",
                "STUDENT",
            ]
        ).exists()