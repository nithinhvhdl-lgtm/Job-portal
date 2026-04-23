# users/urls.py
# ─────────────────────────────────────────────────────────────
# All routes are prefixed with /api/auth/ from main urls.py
#
# Full URLs:
#   POST   /api/auth/register/
#   POST   /api/auth/login/
#   POST   /api/auth/token/refresh/
#   GET    /api/auth/me/
#   GET    /api/auth/profile/
#   PUT    /api/auth/profile/update/
#   POST   /api/auth/profile/resume/upload/
#   GET    /api/auth/admin/users/
#   PUT    /api/auth/admin/users/<id>/toggle/
#   GET    /api/auth/admin/dashboard/
# ─────────────────────────────────────────────────────────────

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [

    # ── Authentication ────────────────────────────────────────
    path('register/',            views.RegisterView.as_view(),       name='register'),
    path('login/',               views.LoginView.as_view(),          name='login'),
    path('token/refresh/',       TokenRefreshView.as_view(),         name='token_refresh'),
    path('me/',                  views.CurrentUserView.as_view(),    name='current_user'),

    # ── Profile ───────────────────────────────────────────────
    path('profile/',             views.ProfileView.as_view(),        name='profile'),
    path('profile/update/',      views.ProfileView.as_view(),        name='profile_update'),
    path('profile/resume/upload/', views.ResumeUploadView.as_view(), name='resume_upload'),

    # ── Admin ─────────────────────────────────────────────────
    path('admin/dashboard/',              views.AdminDashboardView.as_view(),  name='admin_dashboard'),
    path('admin/users/',                  views.AdminUserListView.as_view(),   name='admin_users'),
    path('admin/users/<int:pk>/toggle/',  views.AdminToggleUserView.as_view(), name='admin_toggle_user'),
    
    # Add these two lines to your existing users/urls.py urlpatterns

path('logout/',                           views.LogoutView.as_view(),         name='logout'),
path('change-password/',                  views.ChangePasswordView.as_view(), name='change_password'),
path('admin/users/<int:pk>/delete/',      views.AdminDeleteUserView.as_view(),name='admin_delete_user'),
]