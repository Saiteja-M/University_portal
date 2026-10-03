from django.urls import path

from .views import (
    StudentPasswordResetConfirmView,
    StudentPasswordResetRequestView,
    StudentRegistrationCompleteView,
    StudentRegistrationOptionsView,
    StudentRegistrationVerifyView,
    FacultyPasswordResetConfirmView,
    FacultyPasswordResetRequestView,
)


urlpatterns = [
    path(
        "student/registration/options/",
        StudentRegistrationOptionsView.as_view(),
        name="student-registration-options",
    ),
    path(
        "student/registration/verify/",
        StudentRegistrationVerifyView.as_view(),
        name="student-registration-verify",
    ),
    path(
        "student/registration/complete/",
        StudentRegistrationCompleteView.as_view(),
        name="student-registration-complete",
    ),
    path(
        "student/password-reset/request/",
        StudentPasswordResetRequestView.as_view(),
        name="student-password-reset-request",
    ),
    path(
        "student/password-reset/confirm/",
        StudentPasswordResetConfirmView.as_view(),
        name="student-password-reset-confirm",
    ),
    path(
    "faculty/password-reset/request/",
    FacultyPasswordResetRequestView.as_view(),
    name="faculty-password-reset-request",
),

path(
    "faculty/password-reset/confirm/",
    FacultyPasswordResetConfirmView.as_view(),
    name="faculty-password-reset-confirm",
),
]