from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from drf_spectacular.utils import (
    OpenApiResponse,
    extend_schema,
)

from rest_framework import serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserProfile


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()

    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )


class LoginResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    username = serializers.CharField()
    user_id = serializers.IntegerField()


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={
            200: LoginResponseSerializer,
            400: OpenApiResponse(
                description="Invalid username or password."
            ),
            403: OpenApiResponse(
                description="Account is not authorized to sign in."
            ),
        },
    )
    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        identifier = (
            serializer.validated_data["username"]
            .strip()
        )

        password = (
            serializer.validated_data["password"]
        )

        user = authenticate(
            username=identifier,
            password=password,
        )

        if user is None:
            email_user = (
                User.objects
                .filter(
                    email__iexact=identifier,
                )
                .first()
            )

            if email_user:
                user = authenticate(
                    username=email_user.username,
                    password=password,
                )

        if user is None:
            return Response(
                {
                    "detail": (
                        "Invalid username, email, "
                        "or password."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = getattr(
            user,
            "profile",
            None,
        )

        if (
            profile
            and profile.user_type
            == UserProfile.UserType.STUDENT
            and not profile.is_student_registered
        ):
            return Response(
                {
                    "detail": (
                        "Student portal registration "
                        "is not completed. "
                        "Please complete registration first."
                    ),
                    "code": "STUDENT_NOT_REGISTERED",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(
            user=user,
        )

        return Response(
            {
                "token": token.key,
                "username": user.username,
                "user_id": user.id,
            }
        )


class LogoutView(APIView):
    """
    Revoke the current DRF token.

    Logout is intentionally server-side so a stolen or previously
    persisted token cannot remain valid after the user signs out.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            204: OpenApiResponse(
                description="Authentication token revoked."
            ),
            401: OpenApiResponse(
                description="Authentication is required."
            ),
        },
    )
    def post(self, request):
        Token.objects.filter(
            user=request.user,
        ).delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )
