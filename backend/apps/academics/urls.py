from rest_framework.routers import DefaultRouter

from .views import (
    AcademicYearViewSet,
    CourseViewSet,
    DepartmentViewSet,
    ProgramViewSet,
    RegulationViewSet,
    SemesterViewSet,
)

router = DefaultRouter()

router.register(
    r"departments",
    DepartmentViewSet,
    basename="department",
)

router.register(
    r"programs",
    ProgramViewSet,
    basename="program",
)

router.register(
    r"regulations",
    RegulationViewSet,
    basename="regulation",
)

router.register(
    r"academic-years",
    AcademicYearViewSet,
    basename="academic-year",
)

router.register(
    r"semesters",
    SemesterViewSet,
    basename="semester",
)

router.register(
    r"courses",
    CourseViewSet,
    basename="course",
)

urlpatterns = router.urls