# jobportal/urls.py
# ─────────────────────────────────────────────────────────────
# This is the ROOT url config — every request comes here first
# then gets routed to the correct app
# ─────────────────────────────────────────────────────────────

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [

    # Django admin panel — http://localhost:8000/admin/
    path('admin/', admin.site.urls),

    # All user auth routes — /api/auth/...
    path('api/auth/', include('users.urls')),

    # All job routes — /api/jobs/...
    path('api/', include('jobs.urls')),

]

# Serve uploaded files (resumes, etc.) in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)