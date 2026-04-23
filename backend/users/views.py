# users/views.py
# ─────────────────────────────────────────────────────────────
# All user-related views:
#   - Register
#   - Login
#   - Current User
#   - Profile (get + update)
#   - Resume Upload
#   - Admin Dashboard
#   - Admin User List
#   - Admin Toggle User Active/Inactive
# ─────────────────────────────────────────────────────────────

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import get_user_model
from django.db.models import Count

from .models import Profile
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ProfileSerializer,
    AdminUserSerializer,
)
from jobs.permission import IsAdmin

User = get_user_model()


# ─────────────────────────────────────────────────────────────
# HELPER FUNCTION
# Generates JWT access + refresh tokens for a user
# Called after register and login
# ─────────────────────────────────────────────────────────────

def get_tokens_for_user(user):
    """
    Generate JWT token pair for a given user.

    Returns:
        dict with 'refresh' and 'access' token strings
    """
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


# ─────────────────────────────────────────────────────────────
# REGISTER VIEW
# POST /api/auth/register/
# Anyone can register — no auth required
# ─────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            # Save the new user
            user = serializer.save()

            # Auto-create an empty profile for the user
            Profile.objects.get_or_create(user=user)

            # Generate JWT tokens immediately so user is logged in
            tokens = get_tokens_for_user(user)

            return Response({
                'message': 'Account created successfully.',
                'user':    UserSerializer(user).data,
                'tokens':  tokens,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────
# LOGIN VIEW
# POST /api/auth/login/
# Anyone can login — no auth required
# ─────────────────────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            # User object is attached by LoginSerializer.validate()
            user   = serializer.validated_data['user']
            tokens = get_tokens_for_user(user)

            return Response({
                'message': 'Login successful.',
                'user':    UserSerializer(user).data,
                'tokens':  tokens,
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────
# LOGOUT VIEW
# POST /api/auth/logout/
# Blacklists the refresh token so it cannot be reused
# ─────────────────────────────────────────────────────────────

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Blacklist the token so it cannot be used again
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {'message': 'Logged out successfully.'},
                status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {'error': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


# ─────────────────────────────────────────────────────────────
# CURRENT USER VIEW
# GET /api/auth/me/
# Returns the currently logged-in user's data
# ─────────────────────────────────────────────────────────────

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# PROFILE VIEW
# GET /api/auth/profile/        → get own profile
# PUT /api/auth/profile/update/ → update own profile
# ─────────────────────────────────────────────────────────────

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get or create profile in case it was never created
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(
            profile,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        # partial=True means you can update just one field
        # without sending all fields
        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully.',
                'profile': serializer.data,
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────
# RESUME UPLOAD VIEW
# POST /api/auth/profile/resume/upload/
# Only PDF files allowed
# Max size checked before saving
# ─────────────────────────────────────────────────────────────

class ResumeUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)

        file = request.FILES.get('resume')

        # Check file exists
        if not file:
            return Response(
                {'error': 'No file uploaded. Please attach a PDF file.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check file type
        if not file.name.endswith('.pdf'):
            return Response(
                {'error': 'Only PDF files are allowed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check file size — max 5MB
        max_size = 5 * 1024 * 1024  # 5MB in bytes
        if file.size > max_size:
            return Response(
                {'error': 'File too large. Maximum size is 5MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete old resume if exists
        if profile.resume:
            import os
            if os.path.exists(profile.resume.path):
                os.remove(profile.resume.path)

        # Save new resume
        profile.resume = file
        profile.save()

        return Response({
            'message':    'Resume uploaded successfully.',
            'resume_url': request.build_absolute_uri(profile.resume.url),
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# CHANGE PASSWORD VIEW
# POST /api/auth/change-password/
# User must provide old password to set a new one
# ─────────────────────────────────────────────────────────────

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user         = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm      = request.data.get('confirm_password')

        # Check all fields provided
        if not old_password or not new_password or not confirm:
            return Response(
                {'error': 'All fields are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check old password is correct
        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check new passwords match
        if new_password != confirm:
            return Response(
                {'error': 'New passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check minimum length
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save new password
        user.set_password(new_password)
        user.save()

        return Response(
            {'message': 'Password changed successfully. Please log in again.'},
            status=status.HTTP_200_OK
        )


# ─────────────────────────────────────────────────────────────
# ADMIN DASHBOARD VIEW
# GET /api/auth/admin/dashboard/
# Returns overall stats for the admin panel
# ─────────────────────────────────────────────────────────────

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from jobs.models import Job, Application

        # User stats
        total_users     = User.objects.count()
        total_seekers   = User.objects.filter(role='job_seeker').count()
        total_recruiters= User.objects.filter(role='recruiter').count()
        active_users    = User.objects.filter(is_active=True).count()
        inactive_users  = User.objects.filter(is_active=False).count()

        # Job stats
        total_jobs      = Job.objects.count()
        active_jobs     = Job.objects.filter(status='active').count()
        closed_jobs     = Job.objects.filter(status='closed').count()
        draft_jobs      = Job.objects.filter(status='draft').count()

        # Application stats
        total_apps      = Application.objects.count()
        applied         = Application.objects.filter(status='applied').count()
        shortlisted     = Application.objects.filter(status='shortlisted').count()
        rejected        = Application.objects.filter(status='rejected').count()
        hired           = Application.objects.filter(status='hired').count()

        # Top companies by job count
        top_companies = (
            Job.objects
            .values('company')
            .annotate(job_count=Count('id'))
            .order_by('-job_count')[:5]
        )

        # Recent users (last 5)
        recent_users = User.objects.order_by('-created_at')[:5]

        return Response({
            'users': {
                'total':      total_users,
                'seekers':    total_seekers,
                'recruiters': total_recruiters,
                'active':     active_users,
                'inactive':   inactive_users,
            },
            'jobs': {
                'total':  total_jobs,
                'active': active_jobs,
                'closed': closed_jobs,
                'draft':  draft_jobs,
            },
            'applications': {
                'total':       total_apps,
                'applied':     applied,
                'shortlisted': shortlisted,
                'rejected':    rejected,
                'hired':       hired,
            },
            'top_companies':  list(top_companies),
            'recent_users':   UserSerializer(recent_users, many=True).data,
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# ADMIN USER LIST VIEW
# GET /api/auth/admin/users/
# Returns paginated list of all users
# Supports search by email and name
# ─────────────────────────────────────────────────────────────

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by('-created_at')

        # Optional search by email or name
        search = request.query_params.get('search')
        if search:
            users = users.filter(
                email__icontains=search
            ) | users.filter(
                full_name__icontains=search
            )

        # Optional filter by role
        role = request.query_params.get('role')
        if role:
            users = users.filter(role=role)

        # Optional filter by active status
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            users = users.filter(is_active=is_active.lower() == 'true')

        serializer = AdminUserSerializer(users, many=True)
        return Response({
            'total': users.count(),
            'users': serializer.data,
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# ADMIN TOGGLE USER VIEW
# PUT /api/auth/admin/users/<id>/toggle/
# Activate or deactivate a user account
# ─────────────────────────────────────────────────────────────

class AdminToggleUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Prevent admin from deactivating themselves
        if user == request.user:
            return Response(
                {'error': 'You cannot deactivate your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Toggle active status
        user.is_active = not user.is_active
        user.save()

        state = 'activated' if user.is_active else 'deactivated'

        return Response({
            'message':   f'User {user.email} has been {state}.',
            'is_active': user.is_active,
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# ADMIN DELETE USER VIEW
# DELETE /api/auth/admin/users/<id>/delete/
# Permanently delete a user account
# ─────────────────────────────────────────────────────────────

class AdminDeleteUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Prevent admin from deleting themselves
        if user == request.user:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = user.email
        user.delete()

        return Response({
            'message': f'User {email} has been permanently deleted.',
        }, status=status.HTTP_200_OK)