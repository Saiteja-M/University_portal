from django.urls import include, path

from .authentication import LoginView
from .authorization import UserProfilePermissionView
from .health import HealthCheckView
from .me import CurrentUserView


urlpatterns = [
    path(
        "health/",
        HealthCheckView.as_view(),
        name="health",
    ),

    path(
        "auth/login/",
        LoginView.as_view(),
        name="login",
    ),

    path(
        "auth/me/",
        CurrentUserView.as_view(),
        name="current-user",
    ),

    path(
        "auth/",
        include("apps.accounts.urls"),
    ),

    path(
        "authorization/userprofile/",
        UserProfilePermissionView.as_view(),
        name="userprofile-permission-test",
    ),

    path(
        "academics/",
        include("apps.academics.urls"),
    ),

    path(
        "students/",
        include("apps.students.urls"),
    ),

    path(
        "faculty/",
        include("apps.faculty.urls"),
    ),
    path(
        "timetable/",
        include("apps.timetable.urls"),
    ),
    path(
        "assignments/",
        include("apps.assignments.urls"),
    ),
    path(
    "examinations/",
    include("apps.examinations.urls"),
),
]