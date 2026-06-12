from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User, UserRole
from regional_office.models import Division, RegionalOffice
from batches.models import Cohort, Batch, Participant, Attendance, BatchStage
import datetime

class RegionalManagerDashboardTestCase(APITestCase):
    def setUp(self):
        self.rm_user = User.objects.create_user(
            email="rm@tms.com",
            first_name="Regional",
            last_name="Manager",
            password="password123",
            role=UserRole.REGIONAL_MANAGER,
            is_password_changed=True
        )
        self.trainer = User.objects.create_user(
            email="trainer@tms.com",
            first_name="Trainer",
            last_name="One",
            password="password123",
            role=UserRole.TRAINER,
            is_password_changed=True
        )
        self.division = Division.objects.create(
            name="Dhaka Division",
            included_regions=["Dhaka"]
        )
        self.office = RegionalOffice.objects.create(
            name="Dhaka Head RO",
            division=self.division,
            location="Dhaka"
        )
        # Link RM to office
        self.office.regional_managers.add(self.rm_user)
        
        # Create Batch, Cohort, Participant
        self.cohort = Cohort.objects.create(
            cohort_code="COH-01",
            name="Cohort One"
        )
        self.batch = Batch.objects.create(
            batch_name="Test Batch",
            program="dabi",
            location="Dhaka",
            start_date=datetime.date(2026, 6, 1),
            cohort=self.cohort
        )
        self.participant = Participant.objects.create(
            batch=self.batch,
            first_name="John",
            last_name="Doe",
            email="john@doe.com",
            regional_office=self.office
        )
        
        # Seeded Basic Stage
        self.basic_stage = BatchStage.objects.get(batch=self.batch, stage_type=BatchStage.StageType.BASIC)
        
        # Add some attendance records for basic stage
        Attendance.objects.create(
            batch=self.batch,
            participant=self.participant,
            stage=self.basic_stage,
            date=datetime.date(2026, 6, 1),
            status="present"
        )
        Attendance.objects.create(
            batch=self.batch,
            participant=self.participant,
            stage=self.basic_stage,
            date=datetime.date(2026, 6, 2),
            status="absent"
        )

    def test_permission_denied_for_trainer(self):
        self.client.force_authenticate(user=self.trainer)
        url = reverse("dashboard-regional-manager")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_success_for_regional_manager(self):
        self.client.force_authenticate(user=self.rm_user)
        url = reverse("dashboard-regional-manager")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["participant_id"], self.participant.participant_id)
        self.assertEqual(response.data[0]["name"], "John Doe")
        self.assertEqual(response.data[0]["cohort_id"], self.cohort.id)
        self.assertEqual(response.data[0]["cohort_code"], "COH-01")
        self.assertEqual(response.data[0]["cohort_name"], "Cohort One")
        self.assertEqual(response.data[0]["basic_attendance"], "50% (1/2)")
        self.assertEqual(response.data[0]["refresher_1_attendance"], "N/A")
