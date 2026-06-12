from django.core.management.base import BaseCommand
from users.models import User, UserRole

class Command(BaseCommand):
    help = 'Seeds initial test users for the TMS application'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database with test users...')
        
        # 1. Super Admin (is_superuser=True, is_staff=True, is_password_changed=True)
        if not User.objects.filter(email='admin@tms.com').exists():
            admin_user = User.objects.create_superuser(
                email='admin@tms.com',
                first_name='Super',
                last_name='Admin',
                password='adminpassword'
            )
            self.stdout.write(self.style.SUCCESS(f'Created Super Admin: admin@tms.com (password: adminpassword)'))
        else:
            self.stdout.write('Super Admin already exists.')

        # 2. Other roles (initial password is same as email, is_password_changed=False)
        roles_data = [
            {
                'email': 'supervisor@tms.com',
                'first_name': 'Sarah',
                'last_name': 'Supervisor',
                'role': UserRole.PROGRAM_SUPERVISOR
            },
            {
                'email': 'manager@tms.com',
                'first_name': 'Michael',
                'last_name': 'Manager',
                'role': UserRole.BATCH_MANAGER
            },
            {
                'email': 'mtrainer@tms.com',
                'first_name': 'Melinda',
                'last_name': 'Master Trainer',
                'role': UserRole.MASTER_TRAINER
            },
            {
                'email': 'trainer@tms.com',
                'first_name': 'Travis',
                'last_name': 'Trainer',
                'role': UserRole.TRAINER
            },
            {
                'email': 'logistic@tms.com',
                'first_name': 'Laura',
                'last_name': 'Logistic',
                'role': UserRole.LOGISTIC_MANAGER
            },
            {
                'email': 'rm@tms.com',
                'first_name': 'Ray',
                'last_name': 'Manager',
                'role': UserRole.REGIONAL_MANAGER
            }
        ]

        for item in roles_data:
            if not User.objects.filter(email=item['email']).exists():
                user = User.objects.create_user(
                    email=item['email'],
                    first_name=item['first_name'],
                    last_name=item['last_name'],
                    role=item['role'],
                    password=None # This defaults to email as password
                )
                self.stdout.write(self.style.SUCCESS(f"Created {user.get_role_display()}: {user.email} (password: {user.email})"))
            else:
                self.stdout.write(f"User {item['email']} already exists.")
        
        self.stdout.write(self.style.SUCCESS('Database seeding completed.'))
