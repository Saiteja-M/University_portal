import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import OTPRecord


OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 5
MAX_ATTEMPTS = 5
RESEND_COOLDOWN_SECONDS = 60
CHALLENGE_EXPIRY_MINUTES = 10


def generate_otp():
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_value(value: str) -> str:
    return hashlib.sha256(
        value.encode("utf-8")
    ).hexdigest()


def generate_challenge_token():
    return secrets.token_urlsafe(32)


def can_resend(
    *,
    student=None,
    user=None,
    purpose,
    channel,
):
    queryset = OTPRecord.objects.filter(
        purpose=purpose,
        channel=channel,
        used_at__isnull=True,
    )

    if student is not None:
        queryset = queryset.filter(student=student)

    elif user is not None:
        queryset = queryset.filter(user=user)

    else:
        return False

    latest = (
        queryset
        .order_by("-created_at")
        .first()
    )

    if not latest:
        return True

    cooldown_until = (
        latest.created_at
        + timedelta(
            seconds=RESEND_COOLDOWN_SECONDS
        )
    )

    return timezone.now() >= cooldown_until


def create_otp_record(
    *,
    purpose,
    channel,
    destination,
    student=None,
    user=None,
):
    """
    Create an OTP challenge for either a student
    or a Django authentication user.
    """

    if student is None and user is None:
        raise ValueError(
            "An OTP recipient is required."
        )

    if student is not None and user is not None:
        raise ValueError(
            "An OTP record cannot belong to both "
            "a student and a user."
        )

    if not can_resend(
        student=student,
        user=user,
        purpose=purpose,
        channel=channel,
    ):
        raise ValueError(
            "Please wait before requesting another OTP."
        )

    otp = generate_otp()
    challenge_token = generate_challenge_token()
    now = timezone.now()

    record = OTPRecord.objects.create(
        student=student,
        user=user,
        purpose=purpose,
        channel=channel,
        destination=destination,
        otp_hash=hash_value(otp),
        expires_at=(
            now
            + timedelta(
                minutes=OTP_EXPIRY_MINUTES
            )
        ),
        challenge_token_hash=hash_value(
            challenge_token
        ),
        challenge_expires_at=(
            now
            + timedelta(
                minutes=CHALLENGE_EXPIRY_MINUTES
            )
        ),
    )

    send_otp(
        channel=channel,
        destination=destination,
        otp=otp,
        purpose=purpose,
    )

    return record, challenge_token


def send_otp(
    *,
    channel,
    destination,
    otp,
    purpose,
):
    """
    Send OTP through the configured channel.
    """

    if channel == OTPRecord.Channel.EMAIL:

        send_mail(
            subject=(
                "University Portal Verification Code"
            ),
            message=(
                "Your University Portal "
                "verification code is: "
                f"{otp}\n\n"
                "This code is valid for 5 minutes.\n"
                "Do not share this code with anyone."
            ),
            from_email=getattr(
                settings,
                "DEFAULT_FROM_EMAIL",
                "noreply@university.local",
            ),
            recipient_list=[
                destination
            ],
            fail_silently=False,
        )

    elif channel == OTPRecord.Channel.SMS:

        raise NotImplementedError(
            "SMS provider is not configured yet."
        )

    else:

        raise ValueError(
            f"Unsupported OTP channel: {channel}"
        )


def verify_otp(record, otp):
    """
    Verify a submitted OTP.

    Returns:
        (True, None)
        or
        (False, error_message)
    """

    if record.used_at is not None:
        return (
            False,
            "OTP has already been used.",
        )

    if timezone.now() > record.expires_at:
        return (
            False,
            "OTP has expired.",
        )

    if record.attempt_count >= MAX_ATTEMPTS:
        return (
            False,
            "Maximum OTP attempts exceeded.",
        )

    record.attempt_count += 1

    if hash_value(otp) != record.otp_hash:

        record.save(
            update_fields=[
                "attempt_count",
                "updated_at",
            ]
        )

        return (
            False,
            "Invalid OTP.",
        )

    record.used_at = timezone.now()

    record.save(
        update_fields=[
            "attempt_count",
            "used_at",
            "updated_at",
        ]
    )

    return True, None