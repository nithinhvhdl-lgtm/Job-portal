# users/serializers.py
# ─────────────────────────────────────────────────────────────
# Serializers convert Django model instances to JSON and back.
# Think of them as a bridge between your database and the API.
#
# Flow:
#   Database Model → Serializer → JSON  (sending data out)
#   JSON → Serializer → Database Model  (receiving data in)
# ─────────────────────────────────────────────────────────────

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Profile

User = get_user_model()


# ─────────────────────────────────────────────────────────────
# REGISTER SERIALIZER
# Used by: RegisterView
# Purpose: Validate and create a new user account
# ─────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):

    password  = serializers.CharField(
        write_only=True,       # never returned in response
        required=True,
        validators=[validate_password]  # enforces Django password rules
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        label='Confirm Password'
    )

    class Meta:
        model  = User
        fields = ['id', 'email', 'full_name', 'role', 'password', 'password2']

    def validate_email(self, value):
        """Email must be unique — check before creating."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_role(self, value):
        """Only allow job_seeker or recruiter on registration.
        Admin accounts are created via manage.py createsuperuser only."""
        if value not in ['job_seeker', 'recruiter']:
            raise serializers.ValidationError("Role must be job_seeker or recruiter.")
        return value

    def validate(self, attrs):
        """Check both passwords match."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        """Remove password2, hash the password, save user."""
        validated_data.pop('password2')
        user = User.objects.create_user(
            email     = validated_data['email'],
            password  = validated_data['password'],
            full_name = validated_data['full_name'],
            role      = validated_data.get('role', 'job_seeker'),
        )
        return user


# ─────────────────────────────────────────────────────────────
# LOGIN SERIALIZER
# Used by: LoginView
# Purpose: Validate email + password and return user object
# ─────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):

    email    = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        email    = attrs.get('email')
        password = attrs.get('password')

        # Authenticate against database
        user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("Your account has been deactivated.")

        attrs['user'] = user
        return attrs


# ─────────────────────────────────────────────────────────────
# USER SERIALIZER
# Used by: CurrentUserView, RegisterView response, AdminViews
# Purpose: Return safe user data (no password ever)
# ─────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model  = User
        fields = [
            'id',
            'email',
            'full_name',
            'role',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'email', 'created_at']


# ─────────────────────────────────────────────────────────────
# PROFILE SERIALIZER
# Used by: ProfileView, ResumeUploadView
# Purpose: Read and update user profile data
# ─────────────────────────────────────────────────────────────

class ProfileSerializer(serializers.ModelSerializer):

    # Include user info nested inside profile response
    user = UserSerializer(read_only=True)

    # Show full URL for resume file
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model  = Profile
        fields = [
            'id',
            'user',
            'phone',
            'location',
            'bio',
            'skills',
            'resume',
            'resume_url',
            'linkedin',
        ]
        read_only_fields = ['id', 'user', 'resume_url']
        extra_kwargs = {
            'resume': {'write_only': True}  # hide raw path, show URL instead
        }

    def get_resume_url(self, obj):
        """Return full URL to resume file if it exists."""
        request = self.context.get('request')
        if obj.resume and request:
            return request.build_absolute_uri(obj.resume.url)
        return None

    def validate_skills(self, value):
        """Clean up skills string — strip extra spaces around commas."""
        if value:
            skills = [s.strip() for s in value.split(',') if s.strip()]
            return ', '.join(skills)
        return value


# ─────────────────────────────────────────────────────────────
# ADMIN USER SERIALIZER
# Used by: AdminUserListView, AdminToggleUserView
# Purpose: Full user details for admin management
# ─────────────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):

    total_applications = serializers.SerializerMethodField()
    total_jobs_posted  = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id',
            'email',
            'full_name',
            'role',
            'is_active',
            'created_at',
            'total_applications',
            'total_jobs_posted',
        ]
        read_only_fields = fields

    def get_total_applications(self, obj):
        """How many jobs this user has applied to."""
        return obj.applications.count()

    def get_total_jobs_posted(self, obj):
        """How many jobs this recruiter has posted."""
        return obj.jobs_posted.count()