from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from batches.models import Cohort, Batch, BatchStage, Participant, Attendance
from users.models import User, UserRole
import datetime

class BatchStageTestCase(APITestCase):
    def setUp(self):
        # Create different users for testing permissions
        self.manager = User.objects.create_user(
            email="manager@tms.com",
            first_name="Batch",
            last_name="Manager",
            password="password123",
            role=UserRole.BATCH_MANAGER,
            is_password_changed=True
        )
        self.assigned_trainer = User.objects.create_user(
            email="assigned_trainer@tms.com",
            first_name="Assigned",
            last_name="Trainer",
            password="password123",
            role=UserRole.TRAINER,
            is_password_changed=True
        )
        self.unassigned_trainer = User.objects.create_user(
            email="unassigned_trainer@tms.com",
            first_name="Unassigned",
            last_name="Trainer",
            password="password123",
            role=UserRole.TRAINER,
            is_password_changed=True
        )

        # Create Cohort and Batch
        self.cohort = Cohort.objects.create(
            cohort_code="COH-01",
            name="Cohort One",
            description="First Cohort"
        )
        self.batch = Batch.objects.create(
            program="dabi",
            location="Dhaka",
            start_date=datetime.date(2026, 6, 1),
            cohort=self.cohort
        )
        # Assign trainer to batch
        self.batch.trainers.add(self.assigned_trainer)

    def test_batch_creation_seeds_basic_stage(self):
        # Verify that the basic stage was automatically created on Batch creation
        basic_stage = BatchStage.objects.filter(batch=self.batch, stage_type=BatchStage.StageType.BASIC).first()
        self.assertIsNotNone(basic_stage)
        self.assertEqual(basic_stage.status, BatchStage.StatusChoices.SCHEDULED)
        self.assertEqual(basic_stage.start_date, self.batch.start_date)
        self.assertEqual(basic_stage.end_date, self.batch.start_date)

    def test_schedule_refresher_1_succeeds_even_if_basic_not_completed(self):
        # Authenticate as manager
        self.client.force_authenticate(user=self.manager)
        url = reverse("batch-stage-list")
        
        # Try to schedule refresher_1 while basic is still SCHEDULED (not completed)
        data = {
            "batch": self.batch.id,
            "stage_type": "refresher_1",
            "format": "online",
            "start_date": "2026-06-15",
            "end_date": "2026-06-16",
            "status": "scheduled"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify refresher_1 stage is created
        ref1 = BatchStage.objects.filter(batch=self.batch, stage_type="refresher_1").first()
        self.assertIsNotNone(ref1)
        self.assertEqual(ref1.format, "online")
        self.assertEqual(ref1.status, "scheduled")

    def test_schedule_refresher_2_succeeds_even_if_refresher_1_not_completed(self):
        # Authenticate as manager
        self.client.force_authenticate(user=self.manager)
        url = reverse("batch-stage-list")

        # Try to schedule refresher_2 even though refresher_1 has not been scheduled or completed
        data = {
            "batch": self.batch.id,
            "stage_type": "refresher_2",
            "format": "face_to_face",
            "start_date": "2026-06-20",
            "end_date": "2026-06-21",
            "status": "scheduled"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify refresher_2 stage is created
        ref2 = BatchStage.objects.filter(batch=self.batch, stage_type="refresher_2").first()
        self.assertIsNotNone(ref2)
        self.assertEqual(ref2.format, "face_to_face")
        self.assertEqual(ref2.status, "scheduled")

    def test_permission_checks(self):
        # 1. Unauthenticated users should be blocked
        self.client.force_authenticate(user=None)
        url = reverse("batch-stage-list")
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Unassigned trainer tries to complete basic stage
        self.client.force_authenticate(user=self.unassigned_trainer)
        basic_stage = BatchStage.objects.get(batch=self.batch, stage_type=BatchStage.StageType.BASIC)
        detail_url = reverse("batch-stage-detail", args=[basic_stage.id])
        
        response = self.client.patch(detail_url, {"status": "completed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # 3. Assigned trainer can complete basic stage
        self.client.force_authenticate(user=self.assigned_trainer)
        response = self.client.patch(detail_url, {"status": "completed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        basic_stage.refresh_from_db()
        self.assertEqual(basic_stage.status, BatchStage.StatusChoices.COMPLETED)

    def test_invalid_date_range(self):
        self.client.force_authenticate(user=self.manager)
        basic_stage = BatchStage.objects.get(batch=self.batch, stage_type=BatchStage.StageType.BASIC)
        detail_url = reverse("batch-stage-detail", args=[basic_stage.id])

        # End date before start date
        data = {
            "start_date": "2026-06-10",
            "end_date": "2026-06-09"
        }
        response = self.client.patch(detail_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("end_date", response.data)

    def test_missing_fields_on_schedule(self):
        # Update basic stage to completed
        basic_stage = BatchStage.objects.get(batch=self.batch, stage_type=BatchStage.StageType.BASIC)
        basic_stage.status = BatchStage.StatusChoices.COMPLETED
        basic_stage.save()

        self.client.force_authenticate(user=self.manager)
        url = reverse("batch-stage-list")

        # Missing format
        data = {
            "batch": self.batch.id,
            "stage_type": "refresher_1",
            "start_date": "2026-06-15",
            "end_date": "2026-06-16",
            "status": "scheduled"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)


class BatchAttendanceStageTestCase(APITestCase):
    def setUp(self):
        # Create users
        self.manager = User.objects.create_user(
            email="manager@tms.com",
            first_name="Batch",
            last_name="Manager",
            password="password123",
            role=UserRole.BATCH_MANAGER,
            is_password_changed=True
        )
        self.cohort = Cohort.objects.create(
            cohort_code="COH-01",
            name="Cohort One",
            description="First Cohort"
        )
        self.batch = Batch.objects.create(
            program="dabi",
            location="Dhaka",
            start_date=datetime.date(2026, 6, 1),
            cohort=self.cohort
        )
        # Create participant
        self.participant = Participant.objects.create(
            batch=self.batch,
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com"
        )
        # Fetch seeded basic stage
        self.basic_stage = BatchStage.objects.get(batch=self.batch, stage_type=BatchStage.StageType.BASIC)

    def test_save_and_get_attendance_with_stage(self):
        self.client.force_authenticate(user=self.manager)
        
        # Save attendance linked to basic_stage
        save_url = reverse("batch-save-attendance", args=[self.batch.id])
        data = {
            "date": "2026-06-01",
            "stage": self.basic_stage.id,
            "records": [
                {
                    "participant_id": self.participant.id,
                    "status": "present"
                }
            ]
        }
        response = self.client.post(save_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify db record has correct stage
        att_rec = Attendance.objects.filter(batch=self.batch, date="2026-06-01").first()
        self.assertIsNotNone(att_rec)
        self.assertEqual(att_rec.stage, self.basic_stage)
        self.assertEqual(att_rec.status, "present")

        # Get attendance filtering by stage
        get_url = reverse("batch-get-attendance", args=[self.batch.id]) + f"?date=2026-06-01&stage={self.basic_stage.id}"
        response = self.client.get(get_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["stage"], self.basic_stage.id)

        # Get attendance filtering by a non-existent or other stage (should return empty)
        get_url_empty = reverse("batch-get-attendance", args=[self.batch.id]) + "?date=2026-06-01&stage=999"
        response = self.client.get(get_url_empty)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_participant_regional_office_update(self):
        from regional_office.models import RegionalOffice
        
        self.client.force_authenticate(user=self.manager)
        
        # Create a regional office under the division
        office = RegionalOffice.objects.create(
            name="Dhaka Central RO",
            division=self.batch.division,
            location="Dhaka"
        )
        
        # Patch participant to assign regional office
        detail_url = reverse("participant-detail", args=[self.participant.id])
        data = {
            "regional_office": office.id
        }
        response = self.client.patch(detail_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify db updated
        self.participant.refresh_from_db()
        self.assertEqual(self.participant.regional_office, office)
        self.assertEqual(response.data["regional_office"], office.id)
        self.assertEqual(response.data["regional_office_details"]["name"], "Dhaka Central RO")
