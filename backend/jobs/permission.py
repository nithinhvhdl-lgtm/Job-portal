from rest_framework.permissions import BasePermission

class IsRecruiter(BasePermission):
    message = 'Only recruiters can perform this action.'
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'recruiter'

class IsJobSeeker(BasePermission):
    message = 'Only job seekers can perform this action.'
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'job_seeker'

class IsAdmin(BasePermission):
    message = 'Admin access required.'
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'