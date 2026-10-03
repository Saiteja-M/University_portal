from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    FacultyViewSet,
    FacultyProfileViewSet,
    FacultyQualificationViewSet,
    FacultyExperienceViewSet,
    FacultyCourseAssignmentViewSet,
)


router = DefaultRouter()

router.register(
    r"faculty",
    FacultyViewSet,
    basename="faculty",
)

router.register(
    r"profiles",
    FacultyProfileViewSet,
    basename="faculty-profile",
)

router.register(
    r"qualifications",
    FacultyQualificationViewSet,
    basename="faculty-qualification",
)

router.register(
    r"experiences",
    FacultyExperienceViewSet,
    basename="faculty-experience",
)

router.register(
    r"course-assignments",
    FacultyCourseAssignmentViewSet,
    basename="faculty-course-assignment",
)


urlpatterns = [
    path("", include(router.urls)),
]