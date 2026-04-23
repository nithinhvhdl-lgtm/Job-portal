# jobs/views.py
# ─────────────────────────────────────────────────────────────
# All job-related views:
#   - Job List (public)
#   - Job Detail (public)
#   - Job Create (recruiter)
#   - Job Update (recruiter)
#   - Job Delete (recruiter)
#   - Apply to Job (seeker)
#   - My Applications (seeker)
#   - Job Applications List (recruiter)
#   - Update Application Status (recruiter)
#   - Save / Unsave Job (seeker)
#   - Saved Jobs List (seeker)
#   - Recruiter's own jobs list
# ─────────────────────────────────────────────────────────────

from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser

from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg

from .models import Job, Application, SavedJob
from .serializers import (
    JobSerializer,
    JobListSerializer,
    ApplicationSerializer,
    ApplicationStatusSerializer,
    SavedJobSerializer,
)
from .permission import IsRecruiter, IsJobSeeker, IsAdmin
from .ai_screening import (
    calculate_match_score,
    get_score_label,
    get_candidate_text_from_resume,
)


# ─────────────────────────────────────────────────────────────
# JOB LIST VIEW
# GET /api/jobs/
# Public — anyone can browse jobs
# Supports: search, filter, ordering
# ─────────────────────────────────────────────────────────────

class JobListView(generics.ListAPIView):
    serializer_class   = JobListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['title', 'company', 'location', 'description', 'requirements']
    ordering_fields    = ['created_at', 'salary_min', 'salary_max']
    ordering           = ['-created_at']

    def get_queryset(self):
        queryset = Job.objects.filter(
            status='active'
        ).select_related('recruiter')

        # Filter by job type
        job_type = self.request.query_params.get('job_type')
        if job_type:
            queryset = queryset.filter(job_type=job_type)

        # Filter by location
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)

        # Filter by salary range
        min_salary = self.request.query_params.get('min_salary')
        if min_salary:
            queryset = queryset.filter(salary_min__gte=min_salary)

        max_salary = self.request.query_params.get('max_salary')
        if max_salary:
            queryset = queryset.filter(salary_max__lte=max_salary)

        # Filter by company
        company = self.request.query_params.get('company')
        if company:
            queryset = queryset.filter(company__icontains=company)

        return queryset

    def get_serializer_context(self):
        return {'request': self.request}


# ─────────────────────────────────────────────────────────────
# JOB DETAIL VIEW
# GET /api/jobs/<id>/
# Public — anyone can view job details
# ─────────────────────────────────────────────────────────────

class JobDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        serializer = JobSerializer(
            job,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# JOB CREATE VIEW
# POST /api/jobs/create/
# Recruiter only
# ─────────────────────────────────────────────────────────────

class JobCreateView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiter]

    def post(self, request):
        serializer = JobSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            # Attach the logged-in recruiter automatically
            serializer.save(recruiter=request.user)
            return Response({
                'message': 'Job posted successfully.',
                'job':     serializer.data,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────
# JOB UPDATE VIEW
# PUT /api/jobs/<id>/update/
# Only the recruiter who posted the job can update it
# ─────────────────────────────────────────────────────────────

class JobUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiter]

    def put(self, request, pk):
        job = get_object_or_404(Job, pk=pk)

        # Only the owner recruiter can edit
        if job.recruiter != request.user:
            return Response(
                {'error': 'You can only edit your own job postings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = JobSerializer(
            job,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Job updated successfully.',
                'job':     serializer.data,
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────
# JOB DELETE VIEW
# DELETE /api/jobs/<id>/delete/
# Only the recruiter who posted the job can delete it
# ─────────────────────────────────────────────────────────────

class JobDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiter]

    def delete(self, request, pk):
        job = get_object_or_404(Job, pk=pk)

        # Only the owner recruiter can delete
        if job.recruiter != request.user:
            return Response(
                {'error': 'You can only delete your own job postings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        job.delete()
        return Response(
            {'message': 'Job deleted successfully.'},
            status=status.HTTP_200_OK
        )


# ─────────────────────────────────────────────────────────────
# RECRUITER OWN JOBS VIEW
# GET /api/jobs/my-jobs/
# Returns all jobs posted by the logged-in recruiter
# ─────────────────────────────────────────────────────────────

class MyJobsView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiter]

    def get(self, request):
        jobs = Job.objects.filter(
            recruiter=request.user
        ).order_by('-created_at')

        # Optional filter by status
        job_status = request.query_params.get('status')
        if job_status:
            jobs = jobs.filter(status=job_status)

        serializer = JobSerializer(
            jobs,
            many=True,
            context={'request': request}
        )
        return Response({
            'total': jobs.count(),
            'jobs':  serializer.data,
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# APPLY JOB VIEW
# POST /api/jobs/<job_id>/apply/
# Job seeker only
# Triggers AI screening automatically
# ─────────────────────────────────────────────────────────────

class ApplyJobView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request, job_id):
        # Get job — must be active
        job = get_object_or_404(Job, pk=job_id, status='active')

        # Check not already applied
        if Application.objects.filter(
            job=job,
            applicant=request.user
        ).exists():
            return Response(
                {'error': 'You have already applied to this job.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get profile for skills
        profile = getattr(request.user, 'profile', None)

        # Build candidate text from resume + skills + cover letter
        candidate_text = get_candidate_text_from_resume(
            resume_file    = request.FILES.get('resume'),
            profile_skills = profile.skills if profile else '',
            cover_letter   = request.data.get('cover_letter', ''),
        )

        # Build job text
        job_text = f"{job.title} {job.description} {job.requirements}"

        # Calculate AI match score
        ai_score   = calculate_match_score(job_text, candidate_text)
        score_info = get_score_label(ai_score)

        # Create application
        application = Application.objects.create(
            job          = job,
            applicant    = request.user,
            cover_letter = request.data.get('cover_letter', ''),
            ai_score     = ai_score,
        )

        # Save resume file if uploaded
        if 'resume' in request.FILES:
            application.resume = request.FILES['resume']
            application.save()

        return Response({
            'message':        'Application submitted successfully.',
            'application_id': application.id,
            'ai_score':       ai_score,
            'score_label':    score_info['label'],
            'score_color':    score_info['color'],
        }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────
# MY APPLICATIONS VIEW
# GET /api/applications/my/
# Job seeker sees their own application history
# ─────────────────────────────────────────────────────────────

class MyApplicationsView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def get(self, request):
        applications = Application.objects.filter(
            applicant=request.user
        ).select_related('job', 'job__recruiter').order_by('-applied_at')

        # Optional filter by status
        app_status = request.query_params.get('status')
        if app_status:
            applications = applications.filter(status=app_status)

        serializer = ApplicationSerializer(
            applications,
            many=True,
            context={'request': request}
        )
        return Response({
            'total':        applications.count(),
            'applications': serializer.data,
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# JOB APPLICATIONS VIEW
# GET /api/jobs/<job_id>/applications/
# Recruiter sees all applicants for their job
# Sorted by AI score (best match first)
# ─────────────────────────────────────────────────────────────

class JobApplicationsView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiter]

    def get(self, request, job_id):
        job = get_object_or_404(Job, pk=job_id)

        # Only the job owner can see applicants
        if job.recruiter != request.user:
            return Response(
                {'error': 'You can only view applicants for your own jobs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        applications = Application.objects.filter(
            job=job
        ).select_related(
            'applicant',
            'applicant__profile'
        ).order_by('-ai_score', '-applied_at')

        # Optional filter by status
        app_status = request.query_params.get('status')
        if app_status:
            applications = applications.filter(status=app_status)

        # Summary stats
        stats = {
            'total':       applications.count(),
            'applied':     applications.filter(status='applied').count(),
            'reviewed':    applications.filter(status='reviewed').count(),
            'shortlisted': applications.filter(status='shortlisted').count(),
            'rejected':    applications.filter(status='rejected').count(),
            'hired':       applications.filter(status='hired').count(),
            'avg_score':   applications.aggregate(
                               avg=Avg('ai_score')
                           )['avg'] or 0,
        }

        serializer = ApplicationSerializer(
            applications,
            many=True,
            context={'request': request}
        )

        return Response({
            'job':          JobSerializer(job, context={'request': request}).data,
            'stats':        stats,
            'applications': serializer.data,
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# UPDATE APPLICATION STATUS VIEW
# PUT /api/applications/<id>/status/
# Recruiter updates status of an application
# ─────────────────────────────────────────────────────────────

class UpdateApplicationStatusView(APIView):
    permission_classes = [IsAuthenticated, IsRecruiter]

    def put(self, request, pk):
        application = get_object_or_404(Application, pk=pk)

        # Only the job owner can update status
        if application.job.recruiter != request.user:
            return Response(
                {'error': 'You can only update applications for your own jobs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ApplicationStatusSerializer(
            application,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': f'Application status updated to {application.status}.',
                'application': serializer.data,
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────
# SAVE JOB VIEW
# POST /api/jobs/<job_id>/save/
# Toggle save/unsave a job (bookmark)
# Job seeker only
# ─────────────────────────────────────────────────────────────

class SaveJobView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def post(self, request, job_id):
        job = get_object_or_404(Job, pk=job_id)

        saved = SavedJob.objects.filter(
            user=request.user,
            job=job
        ).first()

        if saved:
            # Already saved — unsave it
            saved.delete()
            return Response(
                {'message': 'Job removed from saved list.', 'saved': False},
                status=status.HTTP_200_OK
            )
        else:
            # Not saved — save it
            SavedJob.objects.create(user=request.user, job=job)
            return Response(
                {'message': 'Job saved successfully.', 'saved': True},
                status=status.HTTP_201_CREATED
            )


# ─────────────────────────────────────────────────────────────
# SAVED JOBS LIST VIEW
# GET /api/jobs/saved/
# Returns all bookmarked jobs for the logged-in seeker
# ─────────────────────────────────────────────────────────────

class SavedJobListView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def get(self, request):
        saved_jobs = SavedJob.objects.filter(
            user=request.user
        ).select_related(
            'job',
            'job__recruiter'
        ).order_by('-saved_at')

        serializer = SavedJobSerializer(
            saved_jobs,
            many=True,
            context={'request': request}
        )
        return Response({
            'total':      saved_jobs.count(),
            'saved_jobs': serializer.data,
        }, status=status.HTTP_200_OK)