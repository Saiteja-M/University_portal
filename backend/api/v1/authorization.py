from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView


class CanViewUserProfile(BasePermission):
    """
    Allow access only to users with the
    accounts.view_userprofile permission.
    """

    def has_permission(self, request, view):
        return request.user.has_perm(
            "accounts.view_userprofile"
        )


class UserProfilePermissionView(APIView):
    """
    Test endpoint for UserProfile RBAC authorization.
    """

    permission_classes = [CanViewUserProfile]

    @extend_schema(
        responses={
            200: OpenApiResponse(
                description="UserProfile permission check succeeded.",
            ),
            403: OpenApiResponse(
                description="User lacks UserProfile permission.",
            ),
        },
    )
    def get(self, request):
        return Response(
            {
                "status": "authorized",
                "user": request.user.username,
                "permission": "accounts.view_userprofile",
            }
        )