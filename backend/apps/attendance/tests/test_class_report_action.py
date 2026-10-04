from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.accounts.models import UserProfile


class AttendanceClassReportRouteTests(APITestCase):
    def test_class_report_route_is_registered_and_validates_required_filters(self):
        user = User.objects.create_user(
            username="attendance-report-faculty",
            password="TestPass123!",
        )
        UserProfile.objects.create(
            user=user,
            user_type=UserProfile.UserType.FACULTY,
            employee_or_student_id="REPORT-FAC-001",
        )
        token = Token.objects.create(user=user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {token.key}"
        )

        response = self.client.get(
            "/api/v1/attendance/sessions/class-report/"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("program", response.data["detail"])
        self.assertIn("academic_year", response.data["detail"])
        self.assertIn("semester", response.data["detail"])
        self.assertIn("course", response.data["detail"])
