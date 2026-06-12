import datetime
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from batches.models import Cohort, Batch, Participant
from regional_office.models import Division, RegionalOffice

class Command(BaseCommand):
    help = 'Seeds 2 cohorts, 5 batches from different divisions, and 15 participants per batch with mixed regional offices.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting seeding...')

        # 1. Add 2 more cohorts
        cohort_a, created_a = Cohort.objects.get_or_create(
            cohort_code='COH-A',
            defaults={
                'name': 'AI & Data Science',
                'description': 'Advanced training in AI, Machine Learning, and Data Analytics.'
            }
        )
        if created_a:
            self.stdout.write(self.style.SUCCESS("Created Cohort: 'AI & Data Science' (COH-A)"))
        else:
            self.stdout.write("Cohort 'COH-A' already exists.")

        cohort_b, created_b = Cohort.objects.get_or_create(
            cohort_code='COH-B',
            defaults={
                'name': 'Cybersecurity Essentials',
                'description': 'Fundamental course on security, threat intelligence, and network defense.'
            }
        )
        if created_b:
            self.stdout.write(self.style.SUCCESS("Created Cohort: 'Cybersecurity Essentials' (COH-B)"))
        else:
            self.stdout.write("Cohort 'COH-B' already exists.")

        cohorts = [cohort_a, cohort_b]

        # Ensure divisions and regional offices exist
        divisions = list(Division.objects.all())
        if len(divisions) < 5:
            self.stdout.write(self.style.ERROR('Expected at least 5 divisions. Please run seed_divisions_and_offices first.'))
            return

        # 2. Add 5 more batches from different divisions
        # We will create one batch per division (for the first 5 divisions)
        batch_names = [
            "AI Applications - Dhaka",
            "Data Analysis - Chattogram",
            "Network Defense - Barishal",
            "Cyber Threat Intelligence - Sylhet",
            "Machine Learning - Khulna"
        ]

        programs = ["dabi", "progoti", "dabi", "progoti", "dabi"]

        created_batches = []
        for i in range(5):
            div = divisions[i]
            cohort = random.choice(cohorts)
            program = programs[i]
            
            # Find offices in this division
            offices = list(div.regional_offices.all())
            if not offices:
                self.stdout.write(self.style.WARNING(f"No regional offices found for division {div.name}. Skipping batch creation for it."))
                continue

            batch_name = batch_names[i]
            batch, created = Batch.objects.get_or_create(
                batch_name=batch_name,
                defaults={
                    'program': program,
                    'division': div,
                    'location': f"{div.name} > {offices[0].name if offices else 'Unknown'}",
                    'start_date': timezone.now().date(),
                    'cohort': cohort
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created Batch: '{batch.batch_name}' in Division '{div.name}'"))
            else:
                self.stdout.write(f"Batch '{batch.batch_name}' already exists.")
            created_batches.append((batch, offices))

        # 3. Add 15 participants per batch with mixed regional offices
        first_names = ["Arif", "Sajid", "Farhana", "Tariq", "Nadia", "Imran", "Sadia", "Rashed", "Tahmina", "Jamil", "Karim", "Rahima", "Salma", "Kamal", "Nasrin"]
        last_names = ["Rahman", "Islam", "Hasan", "Ahmed", "Khan", "Chowdhury", "Akter", "Uddin", "Begum", "Ali", "Hossain", "Sarker", "Patwary", "Talukder", "Miah"]

        for batch, offices in created_batches:
            existing_participants = Participant.objects.filter(batch=batch).count()
            if existing_participants >= 15:
                self.stdout.write(f"Batch '{batch.batch_name}' already has {existing_participants} participants. Skipping participant seeding.")
                continue

            needed = 15 - existing_participants
            self.stdout.write(f"Seeding {needed} participants for Batch '{batch.batch_name}'...")
            
            for j in range(needed):
                # Pick a mix of regional offices from the division
                office = offices[j % len(offices)]
                first_name = first_names[j % len(first_names)]
                last_name = last_names[j % len(last_names)]
                
                # Make email unique
                email = f"{first_name.lower()}.{last_name.lower()}.{batch.id}.{j}@example.com"
                phone = f"+8801712{random.randint(100000, 999999)}"
                
                Participant.objects.create(
                    batch=batch,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone_number=phone,
                    regional_office=office
                )
            
            self.stdout.write(self.style.SUCCESS(f"Successfully seeded participants for '{batch.batch_name}'"))

        self.stdout.write(self.style.SUCCESS('All seeding completed successfully!'))
