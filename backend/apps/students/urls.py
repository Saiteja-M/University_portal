from rest_framework.routers import DefaultRouter

from .views import (
    CourseOfferingEnrollmentViewSet,
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


router.register(
    r"course-offering-enrollments",
    CourseOfferingEnrollmentViewSet,
    basename="course-offering-enrollment",
)

urlpatterns = router.urls
