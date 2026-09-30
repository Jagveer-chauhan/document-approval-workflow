from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import current_user_view, login_view, logout_view

urlpatterns = [
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("me/", current_user_view, name="current_user"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]