from rest_framework.routers import DefaultRouter

from .views import (
    AttendanceRecordViewSet,
    AttendanceSessionViewSet,
    EnrolledStudentViewSet,
)

router = DefaultRouter()

router.register(
    r"sessions",
    AttendanceSessionViewSet,
    basename="attendance-session",
)

router.register(
    r"records",
    AttendanceRecordViewSet,
    basename="attendance-record",
)
router.register(
    r"enrolled-students",
    EnrolledStudentViewSet,
    basename="attendance-enrolled-student",
)
urlpatterns = router.urls