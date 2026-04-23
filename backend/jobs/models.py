from django.db import models
from django.conf import settings

class Job(models.Model):
    JOB_TYPES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('remote', 'Remote'),
        ('internship', 'Internship'),
    ]
    STATUS = [
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('draft', 'Draft'),
    ]
    recruiter    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='jobs_posted')
    title        = models.CharField(max_length=200)
    company      = models.CharField(max_length=150)
    location     = models.CharField(max_length=100)
    job_type     = models.CharField(max_length=30, choices=JOB_TYPES, default='full_time')
    description  = models.TextField()
    requirements = models.TextField()
    salary_min   = models.IntegerField(null=True, blank=True)
    salary_max   = models.IntegerField(null=True, blank=True)
    status       = models.CharField(max_length=20, choices=STATUS, default='active')
    created_at   = models.DateTimeField(auto_now_add=True)
    deadline     = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} @ {self.company}"


class Application(models.Model):
    APP_STATUS = [
        ('applied', 'Applied'),
        ('reviewed', 'Reviewed'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
        ('hired', 'Hired'),
    ]
    job          = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    applicant    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    cover_letter = models.TextField(blank=True)
    resume       = models.FileField(upload_to='applications/', blank=True, null=True)
    status       = models.CharField(max_length=30, choices=APP_STATUS, default='applied')
    ai_score     = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    applied_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['job', 'applicant']  # No duplicate applications
        ordering = ['-ai_score', '-applied_at']  # Best matches first
    # Add this to the bottom of jobs/models.py
# (if you haven't already)

class SavedJob(models.Model):
    user     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_jobs'
    )
    job      = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='saved_by'
    )
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'job']
        ordering        = ['-saved_at']

    def __str__(self):
        return f"{self.user.email} saved {self.job.title}"