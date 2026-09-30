from django.urls import path

from .views import (
    DocumentSubmissionDetailView,
    DocumentSubmissionListCreateView,
    DocumentSubmissionReviewView,
)

urlpatterns = [
    path(
        "",
        DocumentSubmissionListCreateView.as_view(),
        name="submission-list-create",
    ),
    path(
        "<int:pk>/",
        DocumentSubmissionDetailView.as_view(),
        name="submission-detail",
    ),
    path(
        "<int:pk>/review/",
        DocumentSubmissionReviewView.as_view(),
        name="submission-review",
    ),
]