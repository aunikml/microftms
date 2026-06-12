from django.core.management.base import BaseCommand
from django.utils import timezone
from batches.models import Cohort, Batch, Participant

class Command(BaseCommand):
    help = 'Seeds a test batch with 25 trainee participants'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding 25 test trainees...')

        # 1. Create/get test Cohort
        cohort, created = Cohort.objects.get_or_create(
            cohort_code='TEST-COHORT',
            defaults={
                'name': 'Test Cohort Category',
                'description': 'A cohort used for automated seeding and manual testing.'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created Cohort: TEST-COHORT'))

        # 2. Create/get test Batch
        batch, created = Batch.objects.get_or_create(
            batch_name='Test Batch 1',
            defaults={
                'location': 'Dhaka > Dhaka > Savar',
                'start_date': timezone.now().date(),
                'cohort': cohort
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created Batch: Test Batch 1'))

        # 3. Create 25 participants
        trainees_data = [
            ("Arif", "Rahman", "arif.rahman@example.com", "01711122233"),
            ("Tanjina", "Islam", "tanjina.islam@example.com", "01822233344"),
            ("Farhan", "Ahmed", "farhan.ahmed@example.com", "01933344455"),
            ("Sadia", "Sultana", "sadia.sultana@example.com", "01544455566"),
            ("Mohammad", "Ali", "mohammad.ali@example.com", "01655566677"),
            ("Nusrat", "Jahan", "nusrat.jahan@example.com", "01766677788"),
            ("Kaiser", "Hamid", "kaiser.hamid@example.com", "01877788899"),
            ("Rashedul", "Islam", "rashedul.islam@example.com", "01988899900"),
            ("Mim", "Akter", "mim.akter@example.com", "01599900011"),
            ("Sajjad", "Hossain", "sajjad.hossain@example.com", "01600011122"),
            ("Anika", "Tasnim", "anika.tasnim@example.com", "01711133355"),
            ("Mahbubur", "Rahman", "mahbubur.rahman@example.com", "01822244466"),
            ("Zarin", "Tasnim", "zarin.tasnim@example.com", "01933355577"),
            ("Kazi", "Anas", "kazi.anas@example.com", "01544466688"),
            ("Fahmida", "Yesmin", "fahmida.yesmin@example.com", "01655577799"),
            ("Imtiaz", "Ahmed", "imtiaz.ahmed@example.com", "01766688800"),
            ("Nafisa", "Tabassum", "nafisa.tabassum@example.com", "01877799911"),
            ("Ashraful", "Islam", "ashraful.islam@example.com", "01988800022"),
            ("Sumaiya", "Akter", "sumaiya.akter@example.com", "01599911133"),
            ("Shakil", "Khan", "shakil.khan@example.com", "01600022244"),
            ("Tamanna", "Rahman", "tamanna.rahman@example.com", "01711144466"),
            ("Naimur", "Rahman", "naimur.rahman@example.com", "01822255577"),
            ("Sabina", "Yasmin", "sabina.yasmin@example.com", "01933366688"),
            ("Rakibul", "Hasan", "rakibul.hasan@example.com", "01544477799"),
            ("Jannatul", "Ferdous", "jannatul.ferdous@example.com", "01655588800")
        ]

        created_count = 0
        skipped_count = 0

        for first_name, last_name, email, phone in trainees_data:
            if not Participant.objects.filter(batch=batch, email=email).exists():
                Participant.objects.create(
                    batch=batch,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone_number=phone
                )
                created_count += 1
            else:
                skipped_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seeding finished: {created_count} trainees added, {skipped_count} skipped.'
        ))
