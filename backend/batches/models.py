import random
from django.db import models

class Cohort(models.Model):
    cohort_code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.cohort_code})"

class Batch(models.Model):
    class StatusChoices(models.TextChoices):
        INACTIVE = 'inactive', 'Inactive'
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'

    class ProgramChoices(models.TextChoices):
        DABI = 'dabi', 'Dabi'
        PROGOTI = 'progoti', 'Progoti'

    batch_name = models.CharField(max_length=100, blank=True)
    program = models.CharField(
        max_length=20,
        choices=ProgramChoices.choices,
        default=ProgramChoices.DABI
    )
    division = models.ForeignKey(
        'regional_office.Division',
        on_delete=models.SET_NULL,
        related_name='batches',
        null=True,
        blank=True
    )
    location = models.CharField(max_length=100)
    start_date = models.DateField()
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='batches')
    trainers = models.ManyToManyField('users.User', related_name='batches', blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status = models.CharField(
        max_length=15,
        choices=StatusChoices.choices,
        default=StatusChoices.ACTIVE
    )

    def __str__(self):
        return f"{self.batch_name} - {self.location}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        # Auto-generate or update batch_name based on program, cohort, and location
        cohort_code = self.cohort.cohort_code if self.cohort else 'C'
        prog_disp = self.get_program_display()
        self.batch_name = f"{prog_disp} - {cohort_code} - {self.location}"

        if not self.latitude or not self.longitude:
            DIVISION_COORDINATES = {
                'dhaka': (23.8103, 90.4125),
                'chattogram': (22.3569, 91.7832),
                'sylhet': (24.8949, 91.8687),
                'rajshahi': (24.3636, 88.6241),
                'khulna': (22.8456, 89.5403),
                'barishal': (22.7010, 90.3535),
                'rangpur': (25.7439, 89.2753),
                'mymensingh': (24.7471, 90.4203),
            }
            div_name = ''
            if self.division:
                div_name = self.division.name.lower()
            elif self.location:
                parts = [p.strip().lower() for p in self.location.split('>')]
                div_name = parts[0] if parts else ''

            # Clean division name like "dhaka division" -> "dhaka"
            clean_div = div_name.replace('division', '').strip()
            if clean_div in DIVISION_COORDINATES:
                lat, lng = DIVISION_COORDINATES[clean_div]
                import random
                self.latitude = lat + random.uniform(-0.015, 0.015)
                self.longitude = lng + random.uniform(-0.015, 0.015)
        super().save(*args, **kwargs)
        if is_new:
            BatchStage.objects.create(
                batch=self,
                stage_type=BatchStage.StageType.BASIC,
                status=BatchStage.StatusChoices.SCHEDULED,
                start_date=self.start_date,
                end_date=self.start_date
            )



class Participant(models.Model):
    participant_id = models.CharField(max_length=50, unique=True, db_index=True, blank=True)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='participants')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    regional_office = models.ForeignKey(
        'regional_office.RegionalOffice',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='participants'
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.participant_id})"

    def save(self, *args, **kwargs):
        if not self.participant_id:
            cohort_code = self.batch.cohort.cohort_code.upper()
            # Normalize batch name to get alphanumeric characters up to 6 characters
            clean_batch = "".join([c for c in self.batch.batch_name if c.isalnum()]).upper()[:6]
            
            # Find a unique random value
            rand_val = random.randint(1000, 9999)
            self.participant_id = f"PART-{cohort_code}-{clean_batch}-{rand_val}"
            while Participant.objects.filter(participant_id=self.participant_id).exists():
                rand_val = random.randint(1000, 9999)
                self.participant_id = f"PART-{cohort_code}-{clean_batch}-{rand_val}"
                
        super().save(*args, **kwargs)


class Attendance(models.Model):
    class StatusChoices(models.TextChoices):
        PRESENT = 'present', 'Present'
        ABSENT = 'absent', 'Absent'
        LATE = 'late', 'Late'

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='attendance_records')
    stage = models.ForeignKey('BatchStage', on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_records')
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(db_index=True)
    status = models.CharField(max_length=10, choices=StatusChoices.choices, default=StatusChoices.PRESENT)
    marked_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('batch', 'participant', 'date')
        ordering = ['date', 'participant__last_name', 'participant__first_name']

    def __str__(self):
        return f"{self.participant.first_name} {self.participant.last_name} - {self.date} - {self.status}"


class BatchStage(models.Model):
    class StageType(models.TextChoices):
        BASIC = 'basic', 'Basic'
        REFRESHER_1 = 'refresher_1', 'Refresher 1'
        REFRESHER_2 = 'refresher_2', 'Refresher 2'

    class FormatChoices(models.TextChoices):
        FACE_TO_FACE = 'face_to_face', 'Face-to-Face'
        ONLINE = 'online', 'Online'

    class StatusChoices(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SCHEDULED = 'scheduled', 'Scheduled'
        COMPLETED = 'completed', 'Completed'

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='stages')
    stage_type = models.CharField(max_length=20, choices=StageType.choices, default=StageType.BASIC)
    format = models.CharField(max_length=20, choices=FormatChoices.choices, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('batch', 'stage_type')
        ordering = ['stage_type']

    def __str__(self):
        return f"{self.batch.batch_name} - {self.get_stage_type_display()} ({self.get_status_display()})"

