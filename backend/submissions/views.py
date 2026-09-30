from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DocumentSubmission
from .permissions import IsReviewer, IsSubmitter
from .serializers import (
    DocumentSubmissionSerializer,
    ReviewSubmissionSerializer,
)
from .services import create_submission, review_submission


class DocumentSubmissionListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.role == "reviewer":
            return DocumentSubmission.objects.all().order_by("-created_at", "-id")

        return DocumentSubmission.objects.filter(
            submitted_by=self.request.user
        ).order_by("-created_at", "-id")

    def perform_create(self, serializer):
        if self.request.user.role != "submitter":
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only submitters can create submissions."
            )

        serializer.instance = create_submission(
            submitted_by=self.request.user,
            validated_data=serializer.validated_data,
        )


class DocumentSubmissionDetailView(generics.RetrieveAPIView):
    serializer_class = DocumentSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "reviewer":
            return DocumentSubmission.objects.all()

        return DocumentSubmission.objects.filter(
            submitted_by=self.request.user
        )


class DocumentSubmissionReviewView(APIView):
    permission_classes = [IsAuthenticated, IsReviewer]

    def patch(self, request, pk):
        submission = get_object_or_404(DocumentSubmission, pk=pk)

        if submission.status != DocumentSubmission.Status.PENDING:
            return Response(
                {"detail": f"Document has already been {submission.status} and cannot be reviewed again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReviewSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_submission = review_submission(
            submission=submission,
            reviewer=request.user,
            status=serializer.validated_data["status"],
        )

        return Response(
            DocumentSubmissionSerializer(updated_submission).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, pk):
        return self.patch(request, pk)