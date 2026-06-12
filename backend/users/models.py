from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserRole(models.TextChoices):
    SUPER_ADMIN = 'super_admin', 'Super Admin'
    PROGRAM_SUPERVISOR = 'program_supervisor', 'Program Supervisor'
    BATCH_MANAGER = 'batch_manager', 'Batch Manager'
    MASTER_TRAINER = 'master_trainer', 'Master Trainer'
    TRAINER = 'trainer', 'Trainer'
    LOGISTIC_MANAGER = 'logistic_manager', 'Logistic Manager'
    REGIONAL_MANAGER = 'regional_manager', 'RM - Regional Manager'

class UserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, password=None, role=UserRole.TRAINER, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            **extra_fields
        )
        if password:
            user.set_password(password)
        else:
            # If no password is provided, set the email as the password
            user.set_password(email)
            user.is_password_changed = False
        
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_password_changed', True)
        
        if not password:
            raise ValueError('Superusers must have a password')

        return self.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            role=UserRole.SUPER_ADMIN,
            **extra_fields
        )

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.TRAINER
    )
    is_password_changed = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
