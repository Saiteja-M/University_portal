from rest_framework.routers import DefaultRouter
from .views import MyFacultyTimetableViewSet, MyStudentTimetableViewSet, TimetableSlotViewSet

router = DefaultRouter()
router.register("slots", TimetableSlotViewSet, basename="timetable-slot")
router.register("my/faculty", MyFacultyTimetableViewSet, basename="my-faculty-timetable")
router.register("my/student", MyStudentTimetableViewSet, basename="my-student-timetable")

urlpatterns = router.urls
