# jobs/urls.py
# ─────────────────────────────────────────────────────────────
# All routes are prefixed with /api/ from main urls.py
#
# Full URLs:
#   GET    /api/jobs/                        list all active jobs
#   POST   /api/jobs/create/                 recruiter creates job
#   GET    /api/jobs/<id>/                   job detail
#   PUT    /api/jobs/<id>/update/            recruiter edits job
#   DELETE /api/jobs/<id>/delete/            recruiter deletes job
#   POST   /api/jobs/<id>/apply/             seeker applies
#   GET    /api/jobs/<id>/applications/      recruiter sees applicants
#   GET    /api/applications/my/             seeker sees own applications
#   PUT    /api/applications/<id>/status/    recruiter updates status
#   POST   /api/jobs/<id>/save/              seeker saves/bookmarks job
#   GET    /api/jobs/saved/                  seeker sees saved jobs
# ─────────────────────────────────────────────────────────────

from django.urls import path
from . import views

urlpatterns = [

    # ── Job Listings (Public) ─────────────────────────────────
    path('jobs/',                        views.JobListView.as_view(),           name='job_list'),
    path('jobs/saved/',                  views.SavedJobListView.as_view(),      name='saved_jobs'),

    # ── Job CRUD (Recruiter) ──────────────────────────────────
    path('jobs/create/',                 views.JobCreateView.as_view(),         name='job_create'),
    path('jobs/<int:pk>/',               views.JobDetailView.as_view(),         name='job_detail'),
    path('jobs/<int:pk>/update/',        views.JobUpdateView.as_view(),         name='job_update'),
    path('jobs/<int:pk>/delete/',        views.JobDeleteView.as_view(),         name='job_delete'),

    # ── Applications ──────────────────────────────────────────
    path('jobs/<int:job_id>/apply/',          views.ApplyJobView.as_view(),          name='job_apply'),
    path('jobs/<int:job_id>/applications/',   views.JobApplicationsView.as_view(),   name='job_applications'),
    path('applications/my/',                  views.MyApplicationsView.as_view(),    name='my_applications'),
    path('applications/<int:pk>/status/',     views.UpdateApplicationStatusView.as_view(), name='update_app_status'),

    # ── Save / Bookmark Jobs ──────────────────────────────────
    path('jobs/<int:job_id>/save/',      views.SaveJobView.as_view(),           name='save_job'),

]