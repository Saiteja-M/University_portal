from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ExamViewSet,
    AdminStudentResultViewSet,
    FacultyExamViewSet,
    FacultyResultViewSet,
    MyStudentExamViewSet,
    MyResultsView,
    MyResultsSummaryView,
)

router = DefaultRouter()

router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'faculty/exams', FacultyExamViewSet, basename='faculty-exam')
router.register(r'faculty/results', FacultyResultViewSet, basename='faculty-result')
router.register(r'results', AdminStudentResultViewSet, basename='admin-result')
router.register(r'student/exams', MyStudentExamViewSet, basename='student-exam')

urlpatterns = [
    path('results/my/summary/', MyResultsSummaryView.as_view(), name='my-results-summary'),
    path('results/my/', MyResultsView.as_view(), name='my-results'),
    *router.urls,
]
