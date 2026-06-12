from rest_framework import permissions
from users.models import UserRole

class IsPasswordChanged(permissions.BasePermission):
    message = "You must change your initial password before accessing this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_password_changed

class IsRole(permissions.BasePermission):
    allowed_roles = []
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Super admin always has access
        if request.user.role == UserRole.SUPER_ADMIN or request.user.is_superuser:
            return True
        return request.user.role in self.allowed_roles

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role == UserRole.SUPER_ADMIN or request.user.is_superuser
        )

class IsProgramSupervisor(IsRole):
    allowed_roles = [UserRole.PROGRAM_SUPERVISOR]

class IsBatchManager(IsRole):
    allowed_roles = [UserRole.BATCH_MANAGER]

class IsLogisticManager(IsRole):
    allowed_roles = [UserRole.LOGISTIC_MANAGER]

class IsTrainer(IsRole):
    allowed_roles = [UserRole.MASTER_TRAINER, UserRole.TRAINER]
