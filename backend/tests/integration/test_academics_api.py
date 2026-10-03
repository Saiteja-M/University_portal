from django.contrib.auth.models import Group, User
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from apps.academics.models import Department


class AcademicsRBACAndAPITests(APITestCase):

    def create_user_with_role(self, username, role):
        user = User.objects.create_user(
            username=username,
            password="TestPass123!",
        )

        group, _ = Group.objects.get_or_create(
            name=role,
        )

        user.groups.add(group)

        token = Token.objects.create(
            user=user,
        )

        return user, token

    def authenticate(self, token):
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {token.key}"
        )

    def test_admin_can_create_department(self):
        _, token = self.create_user_with_role(
            "admin_user",
            "ADMIN",
        )

        self.authenticate(token)

        response = self.client.post(
            "/api/v1/academics/departments/",
            {
                "code": "CSE",
                "name": "Computer Science and Engineering",
                "description": "CSE Department",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

    def test_hod_can_create_department(self):
        _, token = self.create_user_with_role(
            "hod_user",
            "HOD",
        )

        self.authenticate(token)

        response = self.client.post(
            "/api/v1/academics/departments/",
            {
                "code": "ECE",
                "name": (
                    "Electronics and Communication Engineering"
                ),
                "description": "ECE Department",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

    def test_faculty_can_view_department(self):
        Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )

        _, token = self.create_user_with_role(
            "faculty_user",
            "FACULTY",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/academics/departments/"
        )

        self.assertEqual(response.status_code, 200)

    def test_faculty_cannot_create_department(self):
        _, token = self.create_user_with_role(
            "faculty_user",
            "FACULTY",
        )

        self.authenticate(token)

        response = self.client.post(
            "/api/v1/academics/departments/",
            {
                "code": "ME",
                "name": "Mechanical Engineering",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_student_can_view_department(self):
        Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )

        _, token = self.create_user_with_role(
            "student_user",
            "STUDENT",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/academics/departments/"
        )

        self.assertEqual(response.status_code, 200)

    def test_student_cannot_create_department(self):
        _, token = self.create_user_with_role(
            "student_user",
            "STUDENT",
        )

        self.authenticate(token)

        response = self.client.post(
            "/api/v1/academics/departments/",
            {
                "code": "IT",
                "name": "Information Technology",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_accountant_cannot_view_academics(self):
        _, token = self.create_user_with_role(
            "accountant_user",
            "ACCOUNTANT",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/academics/departments/"
        )

        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_user_cannot_access_academics(self):
        response = self.client.get(
            "/api/v1/academics/departments/"
        )

        self.assertEqual(response.status_code, 401)

    def test_department_search(self):
        Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )

        Department.objects.create(
            code="ECE",
            name="Electronics and Communication Engineering",
        )

        _, token = self.create_user_with_role(
            "search_faculty",
            "FACULTY",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/academics/departments/?search=Computer"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["code"],
            "CSE",
        )

    def test_department_filter(self):
        Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
            is_active=True,
        )

        Department.objects.create(
            code="ECE",
            name="Electronics and Communication Engineering",
            is_active=False,
        )

        _, token = self.create_user_with_role(
            "filter_faculty",
            "FACULTY",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/academics/departments/?is_active=true"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["code"],
            "CSE",
        )

    def test_department_ordering(self):
        Department.objects.create(
            code="CSE",
            name="Computer Science and Engineering",
        )

        Department.objects.create(
            code="ECE",
            name="Electronics and Communication Engineering",
        )

        _, token = self.create_user_with_role(
            "ordering_faculty",
            "FACULTY",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/academics/departments/?ordering=name"
        )

        self.assertEqual(response.status_code, 200)

        names = [
            item["name"]
            for item in response.data["results"]
        ]

        self.assertEqual(
            names,
            sorted(names),
        )

    def test_department_pagination(self):
        for number in range(30):
            Department.objects.create(
                code=f"DEP{number}",
                name=f"Department {number}",
            )

        _, token = self.create_user_with_role(
            "pagination_faculty",
            "FACULTY",
        )

        self.authenticate(token)

        response = self.client.get(
            "/api/v1/academics/departments/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 30)
        self.assertEqual(
            len(response.data["results"]),
            25,
        )

        response = self.client.get(
            "/api/v1/academics/departments/?page=2"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            len(response.data["results"]),
            5,
        )