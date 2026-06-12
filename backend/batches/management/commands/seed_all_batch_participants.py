from django.core.management.base import BaseCommand
from django.utils import timezone
from batches.models import Batch, Participant
import hashlib

class Command(BaseCommand):
    help = 'Ensures every batch has exactly 25 participants'

    def handle(self, *args, **kwargs):
        self.stdout.write('Checking and seeding participants for all batches...')
        batches = Batch.objects.all()
        
        first_names = [
            "Arif", "Tanjina", "Farhan", "Sadia", "Mohammad", "Nusrat", "Kaiser", "Rashedul", "Mim", "Sajjad", 
            "Anika", "Mahbubur", "Zarin", "Kazi", "Fahmida", "Imtiaz", "Nafisa", "Ashraful", "Sumaiya", "Shakil", 
            "Tamanna", "Naimur", "Sabina", "Rakibul", "Jannatul", "Riaz", "Tariq", "Fatima", "Laila", "Jamil", 
            "Sabbir", "Nabil", "Kamrul", "Asif", "Tanvir", "Sajid", "Shaheen", "Fahad", "Joy", "Rony", "Shuvo", 
            "Sohan", "Sakib", "Tamim", "Mushfiq", "Mahmud", "Mustafiz", "Tasnim", "Hasan", "Rahman", "Mahi",
            "Sajedur", "Afsana", "Rashed", "Adnan", "Hasanul", "Maksud", "Rubel", "Kawsar", "Nadia", "Sultana"
        ]
        
        last_names = [
            "Hasan", "Rahman", "Islam", "Khan", "Ahmed", "Ali", "Chowdhury", "Talukder", "Miah", "Sarkar", 
            "Patwary", "Akand", "Bhuiyan", "Uddin", "Munshi", "Siddique", "Hossain", "Bari", "Howlader", "Majumder"
        ]

        total_created = 0

        for batch in batches:
            current_count = Participant.objects.filter(batch=batch).count()
            self.stdout.write(f"Batch '{batch.batch_name}' current trainees: {current_count}")
            
            if current_count >= 25:
                self.stdout.write(self.style.WARNING(f"Batch '{batch.batch_name}' already has {current_count} trainees. Skipping."))
                continue
                
            needed = 25 - current_count
            created_count = 0
            
            for i in range(needed):
                # Generate a unique hash for each index of the batch
                h = hashlib.md5(f"{batch.batch_name}-{i + current_count}".encode('utf-8')).hexdigest()
                fn_idx = int(h[0:4], 16) % len(first_names)
                ln_idx = int(h[4:8], 16) % len(last_names)
                phone_num = f"017{int(h[8:14], 16) % 100000000:08d}"
                
                first_name = first_names[fn_idx]
                last_name = last_names[ln_idx]
                
                email_prefix = f"{first_name.lower()}.{last_name.lower()}.{i + current_count}"
                email_prefix = "".join(c for c in email_prefix if c.isalnum() or c == '.')
                email = f"{email_prefix}@{batch.batch_name.lower().replace(' ', '').replace('-', '')}.com"
                
                if not Participant.objects.filter(batch=batch, email=email).exists():
                    Participant.objects.create(
                        batch=batch,
                        first_name=first_name,
                        last_name=last_name,
                        email=email,
                        phone_number=phone_num
                    )
                    created_count += 1
                    total_created += 1
            
            self.stdout.write(self.style.SUCCESS(f"Added {created_count} trainees to batch '{batch.batch_name}'."))

        self.stdout.write(self.style.SUCCESS(
            f'Seeding finished. Created a total of {total_created} new trainees across all batches.'
        ))
