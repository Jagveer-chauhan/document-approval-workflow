from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import DocumentSubmission


def create_submission(*, submitted_by, validated_data):
    return DocumentSubmission.objects.create(
        submitted_by=submitted_by,
        **validated_data,
    )


def review_submission(*, submission, reviewer, status):
    if submission.status != DocumentSubmission.Status.PENDING:
        raise ValidationError(
            f"Document has already been {submission.status} and cannot be reviewed again."
        )

    submission.status = status
    submission.reviewed_by = reviewer
    submission.reviewed_at = timezone.now()
    submission.save(update_fields=["status", "reviewed_by", "reviewed_at", "updated_at"])
    return submission