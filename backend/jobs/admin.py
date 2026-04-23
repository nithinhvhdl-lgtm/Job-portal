# jobs/admin.py
from django.contrib import admin
from .models import Job, Application, SavedJob


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display  = ['title', 'company', 'recruiter', 'status', 'job_type', 'created_at']
    list_filter   = ['status', 'job_type']
    search_fields = ['title', 'company', 'description']
    ordering      = ['-created_at']


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display  = ['applicant', 'job', 'status', 'ai_score', 'applied_at']
    list_filter   = ['status']
    search_fields = ['applicant__email', 'job__title']
    ordering      = ['-applied_at']


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display  = ['user', 'job', 'saved_at']
    ordering      = ['-saved_at']