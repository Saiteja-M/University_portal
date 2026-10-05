"""URL configuration for config project."""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("api.v1.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/v1/attendance/", include("apps.attendance.urls")),
    path("api/v1/faculty/", include("apps.faculty.urls")),
    path("api/v1/examinations/", include("apps.examinations.urls")),
    path("api/v1/timetable/", include("apps.timetable.urls")),
]
