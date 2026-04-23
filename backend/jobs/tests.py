# jobs/tests.py
# ─────────────────────────────────────────────────────────────
# Run all tests with:  python manage.py test jobs
# Run single test:     python manage.py test jobs.tests.AIScreeningTest
# ─────────────────────────────────────────────────────────────

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal

from .models import Job, Application
from .ai_screening import (
    calculate_match_score,
    get_score_label,
    clean_text,
    extract_tech_skills,
    tfidf_score,
    skill_overlap_score,
    get_candidate_text_from_resume,
)

User = get_user_model()


# ─────────────────────────────────────────────────────────────
# 1. AI SCREENING UNIT TESTS
# ─────────────────────────────────────────────────────────────

class AIScreeningTest(TestCase):
    """
    Tests the AI scoring functions in isolation.
    No database, no API calls — pure logic testing.
    """

    # ── calculate_match_score ─────────────────────────────────

    def test_perfect_match_returns_high_score(self):
        """Candidate has all the skills the job requires."""
        job = "Python Django React developer with SQL and Docker experience"
        candidate = "Python Django React SQL Docker developer 3 years experience"
        score = calculate_match_score(job, candidate)
        self.assertGreaterEqual(score, 60.0)

    def test_no_match_returns_low_score(self):
        """Candidate skills are completely unrelated to the job."""
        job = "Python Django backend developer machine learning"
        candidate = "Graphic designer Photoshop Illustrator InDesign branding"
        score = calculate_match_score(job, candidate)
        self.assertLess(score, 20.0)

    def test_partial_match_returns_middle_score(self):
        """Candidate has some but not all required skills."""
        job = "Python Django React Docker AWS Kubernetes microservices"
        candidate = "Python Django developer some SQL experience"
        score = calculate_match_score(job, candidate)
        self.assertGreater(score, 10.0)
        self.assertLess(score, 80.0)

    def test_empty_job_text_returns_zero(self):
        """If job text is empty, score must be 0."""
        score = calculate_match_score("", "Python Django developer")
        self.assertEqual(score, 0.0)

    def test_empty_candidate_text_returns_zero(self):
        """If candidate text is empty, score must be 0."""
        score = calculate_match_score("Python Django developer", "")
        self.assertEqual(score, 0.0)

    def test_both_empty_returns_zero(self):
        """Both inputs empty — must return 0."""
        score = calculate_match_score("", "")
        self.assertEqual(score, 0.0)

    def test_whitespace_only_returns_zero(self):
        """Whitespace-only inputs should be treated as empty."""
        score = calculate_match_score("   ", "   ")
        self.assertEqual(score, 0.0)

    def test_score_never_exceeds_100(self):
        """Score must always be capped at 100."""
        job = "python django react sql aws docker kubernetes"
        candidate = "python django react sql aws docker kubernetes"
        score = calculate_match_score(job, candidate)
        self.assertLessEqual(score, 100.0)

    def test_score_never_below_zero(self):
        """Score must always be 0 or positive."""
        score = calculate_match_score("python developer", "java developer")
        self.assertGreaterEqual(score, 0.0)

    def test_score_is_float(self):
        """Score must be a float, not int or string."""
        score = calculate_match_score("python django", "python developer")
        self.assertIsInstance(score, float)

    # ── clean_text ────────────────────────────────────────────

    def test_clean_text_lowercases(self):
        result = clean_text("Python DJANGO React")
        self.assertEqual(result, "python django react")

    def test_clean_text_removes_punctuation(self):
        result = clean_text("python, django. react!")
        self.assertNotIn(',', result)
        self.assertNotIn('.', result)
        self.assertNotIn('!', result)

    def test_clean_text_collapses_spaces(self):
        result = clean_text("python   django    react")
        self.assertNotIn('  ', result)

    def test_clean_text_empty_string(self):
        result = clean_text("")
        self.assertEqual(result, "")

    # ── extract_tech_skills ───────────────────────────────────

    def test_extracts_known_skills(self):
        text = "I have experience with Python, Django, React and Docker"
        skills = extract_tech_skills(text)
        self.assertIn('python', skills)
        self.assertIn('django', skills)
        self.assertIn('react', skills)
        self.assertIn('docker', skills)

    def test_ignores_unknown_words(self):
        text = "I love cooking and hiking on weekends"
        skills = extract_tech_skills(text)
        self.assertEqual(len(skills), 0)

    def test_extracts_multiword_skills(self):
        text = "Experience in machine learning and deep learning"
        skills = extract_tech_skills(text)
        self.assertIn('machine learning', skills)
        self.assertIn('deep learning', skills)

    def test_extract_skills_case_insensitive(self):
        text = "PYTHON DJANGO REACT"
        skills = extract_tech_skills(text)
        self.assertIn('python', skills)
        self.assertIn('django', skills)

    # ── skill_overlap_score ───────────────────────────────────

    def test_full_skill_overlap_returns_one(self):
        job = "python django react"
        candidate = "python django react"
        score = skill_overlap_score(job, candidate)
        self.assertEqual(score, 1.0)

    def test_no_skill_overlap_returns_zero(self):
        job = "python django"
        candidate = "photoshop illustrator figma"
        score = skill_overlap_score(job, candidate)
        self.assertEqual(score, 0.0)

    def test_partial_skill_overlap(self):
        job = "python django react aws"
        candidate = "python django"
        score = skill_overlap_score(job, candidate)
        self.assertGreater(score, 0.0)
        self.assertLess(score, 1.0)

    # ── get_score_label ───────────────────────────────────────

    def test_label_excellent(self):
        result = get_score_label(75.0)
        self.assertEqual(result['label'], 'Excellent Match')
        self.assertEqual(result['color'], 'green')

    def test_label_good(self):
        result = get_score_label(55.0)
        self.assertEqual(result['label'], 'Good Match')
        self.assertEqual(result['color'], 'blue')

    def test_label_fair(self):
        result = get_score_label(35.0)
        self.assertEqual(result['label'], 'Fair Match')
        self.assertEqual(result['color'], 'yellow')

    def test_label_low(self):
        result = get_score_label(10.0)
        self.assertEqual(result['label'], 'Low Match')
        self.assertEqual(result['color'], 'red')

    def test_label_boundary_70(self):
        """Exactly 70 should be Excellent Match."""
        result = get_score_label(70.0)
        self.assertEqual(result['label'], 'Excellent Match')

    def test_label_boundary_50(self):
        """Exactly 50 should be Good Match."""
        result = get_score_label(50.0)
        self.assertEqual(result['label'], 'Good Match')


# ─────────────────────────────────────────────────────────────
# 2. JOB MODEL TESTS
# ─────────────────────────────────────────────────────────────

class JobModelTest(TestCase):
    """Tests the Job database model."""

    def setUp(self):
        """Runs before every test — creates a recruiter user and a job."""
        self.recruiter = User.objects.create_user(
            email='recruiter@test.com',
            password='testpass123',
            full_name='Test Recruiter',
            role='recruiter'
        )
        self.job = Job.objects.create(
            recruiter=self.recruiter,
            title='Python Developer',
            company='TechCorp',
            location='Remote',
            job_type='full_time',
            description='We need a Python Django developer',
            requirements='Python Django REST API',
            status='active'
        )

    def test_job_created_successfully(self):
        self.assertEqual(Job.objects.count(), 1)

    def test_job_str_representation(self):
        expected = "Python Developer @ TechCorp"
        self.assertEqual(str(self.job), expected)

    def test_job_default_status_is_active(self):
        self.assertEqual(self.job.status, 'active')

    def test_job_belongs_to_recruiter(self):
        self.assertEqual(self.job.recruiter, self.recruiter)

    def test_job_ordering_latest_first(self):
        """Jobs should be ordered by created_at descending."""
        job2 = Job.objects.create(
            recruiter=self.recruiter,
            title='React Developer',
            company='TechCorp',
            location='Remote',
            job_type='full_time',
            description='React developer needed',
            requirements='React JavaScript',
            status='active'
        )
        jobs = Job.objects.all()
        # Most recently created job should be first
        self.assertEqual(jobs[0], job2)


# ─────────────────────────────────────────────────────────────
# 3. APPLICATION MODEL TESTS
# ─────────────────────────────────────────────────────────────

class ApplicationModelTest(TestCase):
    """Tests the Application database model."""

    def setUp(self):
        self.recruiter = User.objects.create_user(
            email='recruiter@test.com',
            password='testpass123',
            full_name='Recruiter',
            role='recruiter'
        )
        self.seeker = User.objects.create_user(
            email='seeker@test.com',
            password='testpass123',
            full_name='Job Seeker',
            role='job_seeker'
        )
        self.job = Job.objects.create(
            recruiter=self.recruiter,
            title='Python Developer',
            company='TechCorp',
            location='Remote',
            job_type='full_time',
            description='Python Django developer',
            requirements='Python Django',
            status='active'
        )

    def test_application_created_successfully(self):
        app = Application.objects.create(
            job=self.job,
            applicant=self.seeker,
            cover_letter='I am a great Python developer',
            ai_score=75.50
        )
        self.assertEqual(Application.objects.count(), 1)
        self.assertEqual(app.status, 'applied')

    def test_duplicate_application_raises_error(self):
        """Same user cannot apply to the same job twice."""
        Application.objects.create(
            job=self.job,
            applicant=self.seeker,
            ai_score=50.0
        )
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Application.objects.create(
                job=self.job,
                applicant=self.seeker,
                ai_score=60.0
            )

    def test_ai_score_saved_correctly(self):
        app = Application.objects.create(
            job=self.job,
            applicant=self.seeker,
            ai_score=88.75
        )
        saved = Application.objects.get(id=app.id)
        self.assertEqual(float(saved.ai_score), 88.75)


# ─────────────────────────────────────────────────────────────
# 4. JOB API ENDPOINT TESTS
# ─────────────────────────────────────────────────────────────

class JobAPITest(APITestCase):
    """
    Tests the actual API endpoints using DRF's APIClient.
    These tests make real HTTP requests to your views.
    """

    def setUp(self):
        self.client = APIClient()

        # Create users
        self.recruiter = User.objects.create_user(
            email='recruiter@test.com',
            password='testpass123',
            full_name='Recruiter',
            role='recruiter'
        )
        self.seeker = User.objects.create_user(
            email='seeker@test.com',
            password='testpass123',
            full_name='Seeker',
            role='job_seeker'
        )

        # Create a sample job
        self.job = Job.objects.create(
            recruiter=self.recruiter,
            title='Django Developer',
            company='StartupXYZ',
            location='Remote',
            job_type='full_time',
            description='Looking for Django developer with React skills',
            requirements='Python Django React REST API',
            status='active'
        )

    def _auth(self, user):
        """Helper: log in and attach JWT token to client."""
        res = self.client.post('/api/auth/login/', {
            'email': user.email,
            'password': 'testpass123'
        })
        token = res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    # ── Job Listing ───────────────────────────────────────────

    def test_anyone_can_list_jobs(self):
        """Public endpoint — no login needed."""
        res = self.client.get('/api/jobs/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_job_list_returns_active_jobs_only(self):
        """Closed jobs should not appear in listing."""
        Job.objects.create(
            recruiter=self.recruiter,
            title='Closed Job',
            company='OldCo',
            location='NYC',
            job_type='full_time',
            description='This job is closed',
            requirements='Python',
            status='closed'
        )
        res = self.client.get('/api/jobs/')
        titles = [j['title'] for j in res.data['results']]
        self.assertNotIn('Closed Job', titles)

    def test_job_search_by_title(self):
        res = self.client.get('/api/jobs/?search=Django')
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.data['results']), 0)

    def test_job_filter_by_type(self):
        res = self.client.get('/api/jobs/?job_type=full_time')
        self.assertEqual(res.status_code, 200)

    # ── Job Creation ──────────────────────────────────────────

    def test_recruiter_can_create_job(self):
        self._auth(self.recruiter)
        data = {
            'title': 'React Developer',
            'company': 'NewCo',
            'location': 'Remote',
            'job_type': 'full_time',
            'description': 'React developer with TypeScript',
            'requirements': 'React TypeScript JavaScript',
            'status': 'active'
        }
        res = self.client.post('/api/jobs/create/', data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'React Developer')

    def test_job_seeker_cannot_create_job(self):
        self._auth(self.seeker)
        data = {
            'title': 'Fake Job',
            'company': 'FakeCo',
            'location': 'Remote',
            'job_type': 'full_time',
            'description': 'This should fail',
            'requirements': 'Nothing',
        }
        res = self.client.post('/api/jobs/create/', data)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_create_job(self):
        data = {'title': 'Test', 'company': 'Co', 'location': 'NYC',
                'job_type': 'full_time', 'description': 'Test', 'requirements': 'Test'}
        res = self.client.post('/api/jobs/create/', data)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Job Application ───────────────────────────────────────

    def test_seeker_can_apply_to_job(self):
        self._auth(self.seeker)
        res = self.client.post(f'/api/jobs/{self.job.id}/apply/', {
            'cover_letter': 'I have Python and Django experience'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('ai_score', res.data)
        self.assertIn('score_label', res.data)

    def test_seeker_cannot_apply_twice(self):
        self._auth(self.seeker)
        self.client.post(f'/api/jobs/{self.job.id}/apply/', {
            'cover_letter': 'First application'
        })
        res = self.client.post(f'/api/jobs/{self.job.id}/apply/', {
            'cover_letter': 'Second application'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Already applied', res.data['error'])

    def test_recruiter_cannot_apply_to_job(self):
        self._auth(self.recruiter)
        res = self.client.post(f'/api/jobs/{self.job.id}/apply/', {
            'cover_letter': 'Should fail'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_apply_to_closed_job(self):
        self.job.status = 'closed'
        self.job.save()
        self._auth(self.seeker)
        res = self.client.post(f'/api/jobs/{self.job.id}/apply/', {
            'cover_letter': 'Trying closed job'
        })
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_ai_score_is_between_0_and_100(self):
        self._auth(self.seeker)
        res = self.client.post(f'/api/jobs/{self.job.id}/apply/', {
            'cover_letter': 'Python Django developer with React experience'
        })
        self.assertEqual(res.status_code, 201)
        score = res.data['ai_score']
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)