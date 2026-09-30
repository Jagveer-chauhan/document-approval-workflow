from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient(HTTP_HOST="localhost")
        self.submitter = User.objects.create_user(
            username="test.submitter",
            password="testpassword",
            role=User.Role.SUBMITTER,
            first_name="Test",
            last_name="Submitter",
        )
        self.reviewer = User.objects.create_user(
            username="test.reviewer",
            password="testpassword",
            role=User.Role.REVIEWER,
            first_name="Test",
            last_name="Reviewer",
        )

    def test_login_success_submitter(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "test.submitter", "password": "testpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "test.submitter")
        self.assertEqual(response.data["name"], "Test Submitter")
        self.assertEqual(response.data["role"], "submitter")
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_success_reviewer(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "test.reviewer", "password": "testpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "test.reviewer")
        self.assertEqual(response.data["role"], "reviewer")
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_invalid_password(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "test.submitter", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["detail"], "Invalid username or password.")

    def test_login_nonexistent_user(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "unknown.user", "password": "anypassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["detail"], "Invalid username or password.")

    def test_login_missing_username(self):
        response = self.client.post(
            "/api/auth/login/",
            {"password": "testpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Username and password are required.")

    def test_login_missing_password(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "test.submitter"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Username and password are required.")

    def test_login_empty_payload(self):
        response = self.client.post(
            "/api/auth/login/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Username and password are required.")

    def test_current_user_authenticated_submitter(self):
        self.client.force_authenticate(user=self.submitter)
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "test.submitter")
        self.assertEqual(response.data["role"], "submitter")

    def test_current_user_with_jwt_bearer_header(self):
        login_response = self.client.post(
            "/api/auth/login/",
            {"username": "test.submitter", "password": "testpassword"},
            format="json",
        )
        access_token = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "test.submitter")

    def test_current_user_authenticated_reviewer(self):
        self.client.force_authenticate(user=self.reviewer)
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "test.reviewer")
        self.assertEqual(response.data["role"], "reviewer")

    def test_current_user_unauthenticated(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_authenticated_user(self):
        self.client.force_authenticate(user=self.submitter)
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["detail"], "Logged out successfully.")

    def test_logout_unauthenticated_user(self):
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
