from rest_framework.routers import DefaultRouter

from .views import (
    EnrollmentViewSet,
    GuardianViewSet,
    StudentProfileViewSet,
    StudentViewSet,
)


router = DefaultRouter()

router.register(
    r"students",
    StudentViewSet,
    basename="student",
)

router.register(
    r"profiles",
    StudentProfileViewSet,
    basename="student-profile",
)

router.register(
    r"guardians",
    GuardianViewSet,
    basename="guardian",
)

router.register(
    r"enrollments",
    EnrollmentViewSet,
    basename="enrollment",
)


urlpatterns = router.urls