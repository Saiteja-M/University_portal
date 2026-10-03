from drf_spectacular.utils import extend_schema

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class CurrentUserView(APIView):
    """
    Return information about the currently authenticated user.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: dict},
    )
    def get(self, request):
        user = request.user

        groups = list(
            user.groups.values_list(
                "name",
                flat=True,
            )
        )

        profile_data = None

        if hasattr(user, "profile"):
            profile_data = {
                "user_type": user.profile.user_type,
                "phone_number": user.profile.phone_number,
                "employee_or_student_id": (
                    user.profile.employee_or_student_id
                ),
            }

        # Get the Faculty model primary key for faculty users.
        # Non-faculty users receive null.
        faculty_id = None

        if hasattr(user, "faculty"):
            faculty_id = user.faculty.id

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "roles": groups,
                "faculty_id": faculty_id,
                "profile": profile_data,
            }
        )