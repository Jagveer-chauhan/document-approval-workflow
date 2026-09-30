from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import DocumentSubmission

User = get_user_model()


class DocumentSubmissionTests(TestCase):
    def setUp(self):
        self.client = APIClient(HTTP_HOST="localhost")
        self.submitter_alpha = User.objects.create_user(
            username="submitter.alpha",
            password="testpassword",
            role=User.Role.SUBMITTER,
        )
        self.submitter_beta = User.objects.create_user(
            username="submitter.beta",
            password="testpassword",
            role=User.Role.SUBMITTER,
        )
        self.reviewer_one = User.objects.create_user(
            username="reviewer.one",
            password="testpassword",
            role=User.Role.REVIEWER,
        )

        test_file_alpha = SimpleUploadedFile(
            "doc_alpha.pdf",
            b"%PDF-1.4 test document alpha",
            content_type="application/pdf",
        )
        self.submission_alpha = DocumentSubmission.objects.create(
            title="Alpha Document",
            description="Alpha description",
            file=test_file_alpha,
            submitted_by=self.submitter_alpha,
        )

        test_file_beta = SimpleUploadedFile(
            "doc_beta.pdf",
            b"%PDF-1.4 test document beta",
            content_type="application/pdf",
        )
        self.submission_beta = DocumentSubmission.objects.create(
            title="Beta Document",
            description="Beta description",
            file=test_file_beta,
            submitted_by=self.submitter_beta,
        )

    def test_submitter_sees_only_own_submissions(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        response = self.client.get("/api/submissions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.submission_alpha.id)

        self.client.force_authenticate(user=self.submitter_beta)
        response_beta = self.client.get("/api/submissions/")
        self.assertEqual(response_beta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_beta.data), 1)
        self.assertEqual(response_beta.data[0]["id"], self.submission_beta.id)

    def test_reviewer_sees_all_submissions(self):
        self.client.force_authenticate(user=self.reviewer_one)
        response = self.client.get("/api/submissions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        returned_ids = [item["id"] for item in response.data]
        self.assertIn(self.submission_alpha.id, returned_ids)
        self.assertIn(self.submission_beta.id, returned_ids)

    def test_unauthenticated_cannot_list_submissions(self):
        response = self.client.get("/api/submissions/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_submissions_ordered_newest_first(self):
        self.client.force_authenticate(user=self.reviewer_one)
        response = self.client.get("/api/submissions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["id"], self.submission_beta.id)
        self.assertEqual(response.data[1]["id"], self.submission_alpha.id)

    def test_create_submission_valid_pdf(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        upload = SimpleUploadedFile(
            "statement.pdf",
            b"%PDF-1.4 file content",
            content_type="application/pdf",
        )
        response = self.client.post(
            "/api/submissions/",
            {
                "title": "Bank Statement",
                "description": "Financial verification",
                "file": upload,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Bank Statement")
        self.assertEqual(response.data["description"], "Financial verification")
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["submitted_by"], "submitter.alpha")
        self.assertIsNone(response.data["reviewed_by"])
        self.assertIsNone(response.data["reviewed_at"])

    def test_create_submission_valid_docx(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        docx_mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        upload = SimpleUploadedFile("notes.docx", b"PK docx bytes", content_type=docx_mime)
        response = self.client.post(
            "/api/submissions/",
            {"title": "Project Notes", "file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Project Notes")

    def test_create_submission_valid_jpeg(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        upload = SimpleUploadedFile("receipt.jpg", b"jpeg bytes", content_type="image/jpeg")
        response = self.client.post(
            "/api/submissions/",
            {"title": "Receipt Image", "file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_submission_valid_png(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        upload = SimpleUploadedFile("diagram.png", b"png bytes", content_type="image/png")
        response = self.client.post(
            "/api/submissions/",
            {"title": "Architecture Diagram", "file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_submission_reviewer_forbidden(self):
        self.client.force_authenticate(user=self.reviewer_one)
        upload = SimpleUploadedFile("doc.pdf", b"%PDF-1.4", content_type="application/pdf")
        response = self.client.post(
            "/api/submissions/",
            {"title": "Reviewer Doc", "file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only submitters can create submissions.", str(response.data))

    def test_create_submission_unauthenticated_forbidden(self):
        upload = SimpleUploadedFile("doc.pdf", b"%PDF-1.4", content_type="application/pdf")
        response = self.client.post(
            "/api/submissions/",
            {"title": "Anon Doc", "file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_submission_empty_title_fails(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        upload = SimpleUploadedFile("doc.pdf", b"%PDF-1.4", content_type="application/pdf")
        response = self.client.post(
            "/api/submissions/",
            {"title": "", "file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    def test_create_submission_whitespace_title_fails(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        upload = SimpleUploadedFile("doc.pdf", b"%PDF-1.4", content_type="application/pdf")
        response = self.client.post(
            "/api/submissions/",
            {"title": "    ", "file": upload},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)

    def test_create_submission_missing_file_fails(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        response = self.client.post(
            "/api/submissions/",
            {"title": "Missing File Document"},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data)

    def test_create_submission_unsupported_mime_type_fails(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        forbidden_file = SimpleUploadedFile(
            "script.sh",
            b"echo 1",
            content_type="text/plain",
        )
        response = self.client.post(
            "/api/submissions/",
            {"title": "Script File", "file": forbidden_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["file"][0],
            "Only PDF, DOCX, JPG, and PNG files are allowed.",
        )

    def test_create_submission_oversized_file_fails(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        ten_megabytes_plus_one = (10 * 1024 * 1024) + 1
        large_file = SimpleUploadedFile(
            "huge.pdf",
            b"0" * ten_megabytes_plus_one,
            content_type="application/pdf",
        )
        response = self.client.post(
            "/api/submissions/",
            {"title": "Huge Document", "file": large_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["file"][0], "File size cannot exceed 10 MB.")

    def test_retrieve_own_submission_detail(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        response = self.client.get(f"/api/submissions/{self.submission_alpha.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.submission_alpha.id)
        self.assertEqual(response.data["title"], "Alpha Document")

    def test_retrieve_other_submitter_submission_returns_404(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        response = self.client.get(f"/api/submissions/{self.submission_beta.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reviewer_can_retrieve_any_submission_detail(self):
        self.client.force_authenticate(user=self.reviewer_one)
        response_alpha = self.client.get(f"/api/submissions/{self.submission_alpha.id}/")
        self.assertEqual(response_alpha.status_code, status.HTTP_200_OK)
        response_beta = self.client.get(f"/api/submissions/{self.submission_beta.id}/")
        self.assertEqual(response_beta.status_code, status.HTTP_200_OK)

    def test_retrieve_nonexistent_submission_returns_404(self):
        self.client.force_authenticate(user=self.reviewer_one)
        response = self.client.get("/api/submissions/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reviewer_approve_submission(self):
        self.client.force_authenticate(user=self.reviewer_one)
        response = self.client.patch(
            f"/api/submissions/{self.submission_alpha.id}/review/",
            {"status": "approved"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "approved")
        self.assertEqual(response.data["reviewed_by"], "reviewer.one")
        self.assertIsNotNone(response.data["reviewed_at"])

        refreshed = DocumentSubmission.objects.get(id=self.submission_alpha.id)
        self.assertEqual(refreshed.status, DocumentSubmission.Status.APPROVED)
        self.assertEqual(refreshed.reviewed_by, self.reviewer_one)

    def test_reviewer_reject_submission(self):
        self.client.force_authenticate(user=self.reviewer_one)
        response = self.client.patch(
            f"/api/submissions/{self.submission_alpha.id}/review/",
            {"status": "rejected"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "rejected")
        self.assertEqual(response.data["reviewed_by"], "reviewer.one")

    def test_cannot_review_already_approved_submission(self):
        self.client.force_authenticate(user=self.reviewer_one)
        self.client.patch(
            f"/api/submissions/{self.submission_alpha.id}/review/",
            {"status": "approved"},
            format="json",
        )
        second_response = self.client.patch(
            f"/api/submissions/{self.submission_alpha.id}/review/",
            {"status": "rejected"},
            format="json",
        )
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot be reviewed again", second_response.data["detail"])

    def test_cannot_review_already_rejected_submission(self):
        self.client.force_authenticate(user=self.reviewer_one)
        self.client.patch(
            f"/api/submissions/{self.submission_alpha.id}/review/",
            {"status": "rejected"},
            format="json",
        )
        second_response = self.client.patch(
            f"/api/submissions/{self.submission_alpha.id}/review/",
            {"status": "approved"},
            format="json",
        )
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot be reviewed again", second_response.data["detail"])

    def test_reviewer_invalid_status_choice_fails(self):
        self.client.force_authenticate(user=self.reviewer_one)
        response = self.client.patch(
            f"/api/submissions/{self.submission_alpha.id}/review/",
            {"status": "in_progress"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["status"][0],
            "Status must be either 'approved' or 'rejected'.",
        )

    def test_reviewer_empty_status_fails(self):
        self.client.force_authenticate(user=self.reviewer_one)
        response = self.client.patch(
            f"/api/submissions/{self.submission_alpha.id}/review/",
            {"status": ""},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_nonexistent_submission_returns_404(self):
        self.client.force_authenticate(user=self.reviewer_one)
        response = self.client.patch(
            "/api/submissions/99999/review/",
            {"status": "approved"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_submitter_cannot_review_submission(self):
        self.client.force_authenticate(user=self.submitter_alpha)
        response = self.client.patch(
            f"/api/submissions/{self.submission_alpha.id}/review/",
            {"status": "approved"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_review_submission(self):
        response = self.client.patch(
            f"/api/submissions/{self.submission_alpha.id}/review/",
            {"status": "approved"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_model_str_representation(self):
        self.assertEqual(str(self.submission_alpha), "Alpha Document")
