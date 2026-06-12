from django.core.management.base import BaseCommand
from django.utils import timezone
from batches.models import Cohort, Batch

class Command(BaseCommand):
    help = 'Seeds 5 more training batches in 5 separate divisions'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding 5 more batches...')

        # Ensure test Cohort exists
        cohort, _ = Cohort.objects.get_or_create(
            cohort_code='TEST-COHORT',
            defaults={
                'name': 'Test Cohort Category',
                'description': 'A cohort used for automated seeding and manual testing.'
            }
        )

        batches_data = [
            {
                'batch_name': 'Web Dev Bootcamp - Chattogram',
                'location': 'Chattogram > Chattogram > Anwara',
                'start_date': timezone.now().date(),
                'cohort': cohort
            },
            {
                'batch_name': 'Advanced Web - Sylhet',
                'location': 'Sylhet > Sylhet > Fenchuganj',
                'start_date': timezone.now().date(),
                'cohort': cohort
            },
            {
                'batch_name': 'Software Engineering - Rajshahi',
                'location': 'Rajshahi > Rajshahi > Paba',
                'start_date': timezone.now().date(),
                'cohort': cohort
            },
            {
                'batch_name': 'Mobile App Dev - Khulna',
                'location': 'Khulna > Khulna > Rupsha',
                'start_date': timezone.now().date(),
                'cohort': cohort
            },
            {
                'batch_name': 'UI/UX Design - Barishal',
                'location': 'Barishal > Barishal > Babuganj',
                'start_date': timezone.now().date(),
                'cohort': cohort
            }
        ]

        created_count = 0
        existing_count = 0

        for b_data in batches_data:
            batch, created = Batch.objects.get_or_create(
                batch_name=b_data['batch_name'],
                defaults={
                    'location': b_data['location'],
                    'start_date': b_data['start_date'],
                    'cohort': b_data['cohort']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created batch: '{batch.batch_name}' in division: {b_data['location'].split(' > ')[0]}"))
            else:
                existing_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seeding finished: {created_count} new batches created, {existing_count} already existed.'
        ))
