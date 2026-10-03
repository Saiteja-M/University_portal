from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers


class StudentRegistrationVerifySerializer(serializers.Serializer):
    """
    Validates the identity information supplied by a student
    before an OTP is issued.
    """

    student_id = serializers.CharField(
        max_length=30,
    )

    mobile_number = serializers.CharField(
        max_length=20,
    )

    email = serializers.EmailField()

    study_year = serializers.IntegerField(
        min_value=1,
        max_value=4,
    )

    program_id = serializers.IntegerField(
        min_value=1,
    )

    academic_year_id = serializers.IntegerField(
        min_value=1,
    )


class StudentRegistrationCompleteSerializer(serializers.Serializer):
    """
    Validates the OTP and password information required
    to complete student portal registration.
    """

    registration_token = serializers.CharField(
        trim_whitespace=True,
    )

    otp = serializers.RegexField(
        regex=r"^\d{6}$",
        min_length=6,
        max_length=6,
    )

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    password_confirm = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        password = attrs["password"]
        password_confirm = attrs["password_confirm"]

        if password != password_confirm:
            raise serializers.ValidationError(
                {
                    "password_confirm": (
                        "Passwords do not match."
                    )
                }
            )

        validate_password(password)

        return attrs


class StudentPasswordResetRequestSerializer(serializers.Serializer):
    """
    Validates a student password-reset request.
    """

    student_id = serializers.CharField(
        max_length=30,
    )

    channel = serializers.ChoiceField(
        choices=[
            ("EMAIL", "Email"),
            ("SMS", "SMS"),
        ],
    )


class StudentPasswordResetConfirmSerializer(serializers.Serializer):
    """
    Validates the OTP and new password required to
    complete a student password reset.
    """

    reset_token = serializers.CharField(
        trim_whitespace=True,
    )

    otp = serializers.RegexField(
        regex=r"^\d{6}$",
        min_length=6,
        max_length=6,
    )

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    password_confirm = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        password = attrs["password"]
        password_confirm = attrs["password_confirm"]

        if password != password_confirm:
            raise serializers.ValidationError(
                {
                    "password_confirm": (
                        "Passwords do not match."
                    )
                }
            )

        validate_password(password)

        return attrs
class FacultyPasswordResetRequestSerializer(
    serializers.Serializer
):
    """
    Validates a faculty password-reset request.
    """

    email = serializers.EmailField()


class FacultyPasswordResetConfirmSerializer(
    serializers.Serializer
):
    """
    Validates the OTP and new password required
    to complete a faculty password reset.
    """

    reset_token = serializers.CharField(
        trim_whitespace=True,
    )

    otp = serializers.RegexField(
        regex=r"^\d{6}$",
        min_length=6,
        max_length=6,
    )

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    password_confirm = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )

    def validate(self, attrs):
        password = attrs["password"]
        password_confirm = attrs[
            "password_confirm"
        ]

        if password != password_confirm:
            raise serializers.ValidationError(
                {
                    "password_confirm": (
                        "Passwords do not match."
                    )
                }
            )

        validate_password(password)

        return attrs    