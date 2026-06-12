from django.core.management.base import BaseCommand
from datetime import date
from batches.models import Cohort, Batch
from users.models import User

class Command(BaseCommand):
    help = 'Seeds 5 more batches: 2 in this year (2026) and 3 in next year (2027)'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding 5 future batches...')

        # Ensure test Cohort exists
        cohort, _ = Cohort.objects.get_or_create(
            cohort_code='TEST-COHORT',
            defaults={
                'name': 'Test Cohort Category',
                'description': 'A cohort used for automated seeding and manual testing.'
            }
        )

        # Get trainers
        trainer = User.objects.filter(email='trainer@tms.com').first()
        mtrainer = User.objects.filter(email='mtrainer@tms.com').first()

        batches_data = [
            # This Year (2026)
            {
                'batch_name': 'Cybersecurity Fundamentals - Dhaka',
                'location': 'Dhaka > Dhaka > Ramna',
                'start_date': date(2026, 10, 15),
                'status': 'active',
                'trainer_email': 'trainer@tms.com'
            },
            {
                'batch_name': 'Data Science Bootcamp - Rajshahi',
                'location': 'Rajshahi > Rajshahi > Boalia',
                'start_date': date(2026, 12, 5),
                'status': 'active',
                'trainer_email': 'mtrainer@tms.com'
            },
            # Next Year (2027)
            {
                'batch_name': 'React Native Apps - Chattogram',
                'location': 'Chattogram > Chattogram > Halishahar',
                'start_date': date(2027, 2, 10),
                'status': 'inactive',
                'trainer_email': 'trainer@tms.com'
            },
            {
                'batch_name': 'Cloud Architecture - Sylhet',
                'location': 'Sylhet > Sylhet > Balaganj',
                'start_date': date(2027, 4, 20),
                'status': 'inactive',
                'trainer_email': 'mtrainer@tms.com'
            },
            {
                'batch_name': 'AI & Machine Learning - Khulna',
                'location': 'Khulna > Khulna > Phultala',
                'start_date': date(2027, 8, 12),
                'status': 'inactive',
                'trainer_email': 'trainer@tms.com'
            }
        ]

        created_count = 0
        for b_data in batches_data:
            batch, created = Batch.objects.get_or_create(
                batch_name=b_data['batch_name'],
                defaults={
                    'location': b_data['location'],
                    'start_date': b_data['start_date'],
                    'cohort': cohort,
                    'status': b_data['status']
                }
            )
            if created:
                created_count += 1
                # Assign trainer
                t_user = User.objects.filter(email=b_data['trainer_email']).first()
                if t_user:
                    batch.trainers.add(t_user)
                self.stdout.write(self.style.SUCCESS(
                    f"Created batch: '{batch.batch_name}' starting {batch.start_date} in division: {b_data['location'].split(' > ')[0]}"
                ))
            else:
                self.stdout.write(f"Batch '{batch.batch_name}' already exists.")

        self.stdout.write(self.style.SUCCESS(f'Finished seeding: {created_count} batches created.'))
