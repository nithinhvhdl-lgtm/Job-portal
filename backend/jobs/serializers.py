# jobs/serializers.py
# ─────────────────────────────────────────────────────────────
# Serializers for Job and Application models
# ─────────────────────────────────────────────────────────────

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Job, Application, SavedJob
from .ai_screening import get_score_label

User = get_user_model()


# ─────────────────────────────────────────────────────────────
# RECRUITER MINI SERIALIZER
# Used inside JobSerializer to show who posted the job
# ─────────────────────────────────────────────────────────────

class RecruiterSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'full_name', 'email']


# ─────────────────────────────────────────────────────────────
# JOB SERIALIZER
# Used by: JobListView, JobCreateView, JobDetailView
# Purpose: Read and write Job data
# ─────────────────────────────────────────────────────────────

class JobSerializer(serializers.ModelSerializer):

    # Show recruiter details nested (read only)
    recruiter         = RecruiterSerializer(read_only=True)

    # Extra computed fields
    total_applicants  = serializers.SerializerMethodField()
    is_saved          = serializers.SerializerMethodField()
    has_applied       = serializers.SerializerMethodField()

    class Meta:
        model  = Job
        fields = [
            'id',
            'recruiter',
            'title',
            'company',
            'location',
            'job_type',
            'description',
            'requirements',
            'salary_min',
            'salary_max',
            'status',
            'created_at',
            'deadline',
            'total_applicants',
            'is_saved',
            'has_applied',
        ]
        read_only_fields = ['id', 'recruiter', 'created_at']

    def get_total_applicants(self, obj):
        """Total number of people who applied to this job."""
        return obj.applications.count()

    def get_is_saved(self, obj):
        """Has the current logged-in user saved/bookmarked this job?"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedJob.objects.filter(
                user=request.user,
                job=obj
            ).exists()
        return False

    def get_has_applied(self, obj):
        """Has the current logged-in user already applied to this job?"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Application.objects.filter(
                job=obj,
                applicant=request.user
            ).exists()
        return False

    def validate_deadline(self, value):
        """Deadline must be in the future."""
        from django.utils import timezone
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Deadline must be a future date.")
        return value

    def validate(self, attrs):
        """Salary min must be less than salary max."""
        salary_min = attrs.get('salary_min')
        salary_max = attrs.get('salary_max')
        if salary_min and salary_max and salary_min > salary_max:
            raise serializers.ValidationError({
                "salary_min": "Minimum salary cannot be greater than maximum salary."
            })
        return attrs


# ─────────────────────────────────────────────────────────────
# JOB LIST SERIALIZER
# Used by: JobListView (lighter version for listing)
# Purpose: Faster response — no description/requirements
# ─────────────────────────────────────────────────────────────

class JobListSerializer(serializers.ModelSerializer):

    recruiter        = RecruiterSerializer(read_only=True)
    total_applicants = serializers.SerializerMethodField()
    has_applied      = serializers.SerializerMethodField()
    is_saved         = serializers.SerializerMethodField()

    class Meta:
        model  = Job
        fields = [
            'id',
            'recruiter',
            'title',
            'company',
            'location',
            'job_type',
            'salary_min',
            'salary_max',
            'status',
            'created_at',
            'deadline',
            'total_applicants',
            'has_applied',
            'is_saved',
        ]

    def get_total_applicants(self, obj):
        return obj.applications.count()

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Application.objects.filter(
                job=obj,
                applicant=request.user
            ).exists()
        return False

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedJob.objects.filter(
                user=request.user,
                job=obj
            ).exists()
        return False


# ─────────────────────────────────────────────────────────────
# APPLICANT MINI SERIALIZER
# Used inside ApplicationSerializer
# ─────────────────────────────────────────────────────────────

class ApplicantSerializer(serializers.ModelSerializer):

    skills   = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'full_name', 'email', 'skills', 'location']

    def get_skills(self, obj):
        """Get skills from the user's profile."""
        profile = getattr(obj, 'profile', None)
        return profile.skills if profile else ""

    def get_location(self, obj):
        """Get location from the user's profile."""
        profile = getattr(obj, 'profile', None)
        return profile.location if profile else ""


# ─────────────────────────────────────────────────────────────
# APPLICATION SERIALIZER
# Used by: ApplyJobView, MyApplicationsView, JobApplicationsView
# Purpose: Read and write Application data
# ─────────────────────────────────────────────────────────────

class ApplicationSerializer(serializers.ModelSerializer):

    # Nested data (read only)
    applicant  = ApplicantSerializer(read_only=True)
    job        = JobListSerializer(read_only=True)

    # Extra computed fields
    score_info = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model  = Application
        fields = [
            'id',
            'job',
            'applicant',
            'cover_letter',
            'resume',
            'resume_url',
            'status',
            'ai_score',
            'score_info',
            'applied_at',
        ]
        read_only_fields = [
            'id',
            'applicant',
            'ai_score',
            'score_info',
            'applied_at',
            'resume_url',
        ]
        extra_kwargs = {
            'resume': {'write_only': True}
        }

    def get_score_info(self, obj):
        """Return human-readable label and color for the AI score."""
        return get_score_label(float(obj.ai_score))

    def get_resume_url(self, obj):
        """Return full URL to application resume if uploaded."""
        request = self.context.get('request')
        if obj.resume and request:
            return request.build_absolute_uri(obj.resume.url)
        return None


# ─────────────────────────────────────────────────────────────
# APPLICATION STATUS SERIALIZER
# Used by: UpdateApplicationStatusView (recruiter only)
# Purpose: Only allow updating the status field
# ─────────────────────────────────────────────────────────────

class ApplicationStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Application
        fields = ['id', 'status']

    def validate_status(self, value):
        """Only allow valid status transitions."""
        allowed = ['applied', 'reviewed', 'shortlisted', 'rejected', 'hired']
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(allowed)}"
            )
        return value


# ─────────────────────────────────────────────────────────────
# SAVED JOB SERIALIZER
# Used by: SaveJobView, SavedJobListView
# Purpose: Read saved/bookmarked jobs
# ─────────────────────────────────────────────────────────────

class SavedJobSerializer(serializers.ModelSerializer):

    job = JobListSerializer(read_only=True)

    class Meta:
        model  = SavedJob
        fields = ['id', 'job', 'saved_at']
        read_only_fields = ['id', 'saved_at']