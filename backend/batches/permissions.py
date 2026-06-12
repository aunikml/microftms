from rest_framework import permissions
from users.models import UserRole

class IsAssignedTrainerOrManager(permissions.BasePermission):
    """
    Allows access to Super Admin, Program Supervisor, and Batch Manager.
    Allows Trainers and Master Trainers access ONLY if they are assigned to the batch.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_password_changed:
            return False
            
        # Admins, Managers, and Logistic Managers always have permission
        if request.user.role in [UserRole.SUPER_ADMIN, UserRole.PROGRAM_SUPERVISOR, UserRole.BATCH_MANAGER, UserRole.LOGISTIC_MANAGER, UserRole.REGIONAL_MANAGER] or request.user.is_superuser:
            return True
            
        # Trainers can check object-level permissions
        if request.user.role in [UserRole.TRAINER, UserRole.MASTER_TRAINER]:
            return True
            
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role in [UserRole.SUPER_ADMIN, UserRole.PROGRAM_SUPERVISOR, UserRole.BATCH_MANAGER, UserRole.LOGISTIC_MANAGER, UserRole.REGIONAL_MANAGER] or request.user.is_superuser:
            return True
            
        # Check if the user is in batch's trainers list
        if hasattr(obj, 'trainers'):
            return obj.trainers.filter(id=request.user.id).exists()
            
        if hasattr(obj, 'batch'):
            return obj.batch.trainers.filter(id=request.user.id).exists()
            
        return False
