from django.core.management.base import BaseCommand
from users.models import User, UserRole
from regional_office.models import Division, RegionalOffice
import random

class Command(BaseCommand):
    help = 'Seeds 5 Divisions with 4 Regional Offices in each'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding Divisions and Regional Offices...')

        # Ensure we have at least a few Regional Managers
        managers = list(User.objects.filter(role=UserRole.REGIONAL_MANAGER))
        if len(managers) < 5:
            self.stdout.write('Not enough Regional Managers found. Seeding test Regional Managers...')
            for i in range(1, 6):
                email = f'rm_seed{i}@tms.com'
                if not User.objects.filter(email=email).exists():
                    mgr = User.objects.create_user(
                        email=email,
                        first_name=f'Seed_RM_{i}',
                        last_name='Manager',
                        role=UserRole.REGIONAL_MANAGER,
                        password='password123'
                    )
                    mgr.is_password_changed = True
                    mgr.save()
                    managers.append(mgr)
            managers = list(User.objects.filter(role=UserRole.REGIONAL_MANAGER))

        # Define 5 Divisions and their 4 Regional Offices
        seed_data = [
            {
                "division_name": "Dhaka Division",
                "included_regions": ["Dhaka", "Dhamrai (Dhaka)", "Dohar (Dhaka)", "Keraniganj (Dhaka)", "Savar (Dhaka)"],
                "offices": [
                    {"name": "Dhaka Head RO", "location": "Dhaka"},
                    {"name": "Dhamrai RO", "location": "Dhamrai (Dhaka)"},
                    {"name": "Dohar RO", "location": "Dohar (Dhaka)"},
                    {"name": "Savar RO", "location": "Savar (Dhaka)"}
                ]
            },
            {
                "division_name": "Chattogram Division",
                "included_regions": ["Chattogram", "Anwara (Chattogram)", "Banshkhali (Chattogram)", "Boalkhali (Chattogram)", "Patiya (Chattogram)"],
                "offices": [
                    {"name": "Chattogram Main RO", "location": "Chattogram"},
                    {"name": "Anwara Hub", "location": "Anwara (Chattogram)"},
                    {"name": "Banshkhali Branch", "location": "Banshkhali (Chattogram)"},
                    {"name": "Patiya RO", "location": "Patiya (Chattogram)"}
                ]
            },
            {
                "division_name": "Barishal Division",
                "included_regions": ["Barishal", "Agailjhara (Barishal)", "Babuganj (Barishal)", "Bakerganj (Barishal)", "Banaripara (Barishal)"],
                "offices": [
                    {"name": "Barishal Central RO", "location": "Barishal"},
                    {"name": "Agailjhara Hub", "location": "Agailjhara (Barishal)"},
                    {"name": "Babuganj RO", "location": "Babuganj (Barishal)"},
                    {"name": "Bakerganj Office", "location": "Bakerganj (Barishal)"}
                ]
            },
            {
                "division_name": "Sylhet Division",
                "included_regions": ["Sylhet", "Balaganj (Sylhet)", "Beanibazar (Sylhet)", "Bishwanath (Sylhet)", "Fenchuganj (Sylhet)"],
                "offices": [
                    {"name": "Sylhet Town RO", "location": "Sylhet"},
                    {"name": "Balaganj Point", "location": "Balaganj (Sylhet)"},
                    {"name": "Beanibazar Hub", "location": "Beanibazar (Sylhet)"},
                    {"name": "Fenchuganj Station", "location": "Fenchuganj (Sylhet)"}
                ]
            },
            {
                "division_name": "Khulna Division",
                "included_regions": ["Khulna", "Batiaghata (Khulna)", "Dacope (Khulna)", "Dighalia (Khulna)", "Phultala (Khulna)"],
                "offices": [
                    {"name": "Khulna Sadar RO", "location": "Khulna"},
                    {"name": "Batiaghata Office", "location": "Batiaghata (Khulna)"},
                    {"name": "Dacope Hub", "location": "Dacope (Khulna)"},
                    {"name": "Phultala Branch", "location": "Phultala (Khulna)"}
                ]
            }
        ]

        for div_info in seed_data:
            div, created = Division.objects.get_or_create(
                name=div_info["division_name"],
                defaults={"included_regions": div_info["included_regions"]}
            )
            if not created:
                # Update included regions to match exactly what is defined
                div.included_regions = div_info["included_regions"]
                div.save()
                self.stdout.write(f'Updated Division: {div.name}')
            else:
                self.stdout.write(f'Created Division: {div.name}')

            # Create the 4 offices for this division
            for office_info in div_info["offices"]:
                office, office_created = RegionalOffice.objects.get_or_create(
                    name=office_info["name"],
                    defaults={
                        "division": div,
                        "location": office_info["location"]
                    }
                )
                if office_created:
                    # Assign a random manager or two
                    assigned_managers = random.sample(managers, k=min(len(managers), 2))
                    office.regional_managers.set(assigned_managers)
                    self.stdout.write(f'  Created Regional Office: {office.name} ({office.location})')
                else:
                    # Ensure location and division are correct
                    office.division = div
                    office.location = office_info["location"]
                    office.save()
                    self.stdout.write(f'  Verified Regional Office: {office.name}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded 5 divisions with 4 regional offices each.'))
