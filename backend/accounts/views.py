from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate user credentials and issue JSON Web Tokens."""
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"detail": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh_token = RefreshToken.for_user(user)

    return Response(
        {
            "access": str(refresh_token.access_token),
            "refresh": str(refresh_token),
            "id": user.id,
            "username": user.username,
            "name": user.get_full_name(),
            "role": user.role,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Stateless logout endpoint for token-based authentication."""
    return Response(
        {"detail": "Logged out successfully."},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """Retrieve profile information for the currently authenticated user."""
    return Response(
        {
            "id": request.user.id,
            "username": request.user.username,
            "name": request.user.get_full_name(),
            "role": request.user.role,
        },
        status=status.HTTP_200_OK,
    )