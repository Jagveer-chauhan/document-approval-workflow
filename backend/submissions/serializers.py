from rest_framework import serializers

from .models import DocumentSubmission


class DocumentSubmissionSerializer(serializers.ModelSerializer):
    submitted_by = serializers.ReadOnlyField(
        source="submitted_by.username"
    )
    reviewed_by = serializers.SerializerMethodField()

    def get_reviewed_by(self, obj):
        return obj.reviewed_by.username if obj.reviewed_by else None

    class Meta:
        model = DocumentSubmission
        fields = [
            "id",
            "title",
            "description",
            "file",
            "submitted_by",
            "status",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "submitted_by",
            "status",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Title cannot be empty."
            )

        return value.strip()

    def validate_file(self, uploaded_file):
        maximum_file_size = 10 * 1024 * 1024

        allowed_content_types = {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
        }

        if uploaded_file.size > maximum_file_size:
            raise serializers.ValidationError(
                "File size cannot exceed 10 MB."
            )

        if uploaded_file.content_type not in allowed_content_types:
            raise serializers.ValidationError(
                "Only PDF, DOCX, JPG, and PNG files are allowed."
            )

        return uploaded_file


class ReviewSubmissionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            DocumentSubmission.Status.APPROVED,
            DocumentSubmission.Status.REJECTED,
        ],
        error_messages={
            "invalid_choice": "Status must be either 'approved' or 'rejected'."
        },
    )