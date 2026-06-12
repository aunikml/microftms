from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User, UserRole
from logistics.models import LogisticsItem, Accommodation, Transport, LogisticsRequest, LogisticsRequestItem

class LogisticsAPITests(APITestCase):
    def setUp(self):
        # 1. Create a super admin
        self.admin = User.objects.create_superuser(
            email='admin@tms.com',
            first_name='Admin',
            last_name='User',
            password='adminpassword'
        )

        # 2. Create a logistics manager
        self.logistic_mgr = User.objects.create_user(
            email='logistic@tms.com',
            first_name='Laura',
            last_name='Logistic',
            role=UserRole.LOGISTIC_MANAGER,
            password='securepassword'
        )
        self.logistic_mgr.is_password_changed = True
        self.logistic_mgr.save()

        # 3. Create a normal trainer (who shouldn't have logistics access)
        self.trainer = User.objects.create_user(
            email='trainer@tms.com',
            first_name='Travis',
            last_name='Trainer',
            role=UserRole.TRAINER,
            password='securepassword'
        )
        self.trainer.is_password_changed = True
        self.trainer.save()

        # 4. Create a logistic manager who has NOT changed password
        self.logistic_no_pwd_change = User.objects.create_user(
            email='logistic_temp@tms.com',
            first_name='Temp',
            last_name='Logistic',
            role=UserRole.LOGISTIC_MANAGER,
            password=None # means is_password_changed = False
        )

    def test_unauthenticated_access_denied(self):
        """
        Unauthenticated requests to logistics endpoints are rejected.
        """
        url = reverse('logistics-item-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_force_password_change_applies(self):
        """
        Users who have not changed their initial password are denied access (403).
        """
        self.client.force_authenticate(user=self.logistic_no_pwd_change)
        url = reverse('logistics-item-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("change your initial password", response.data['detail'])

    def test_role_based_access_denied_for_trainers(self):
        """
        Trainers are not allowed to access logistics management.
        """
        self.client.force_authenticate(user=self.trainer)
        url = reverse('logistics-item-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logistic_manager_crud_operations(self):
        """
        Logistic managers can perform CRUD on LogisticsItems, Accommodations, and Transports.
        """
        self.client.force_authenticate(user=self.logistic_mgr)

        # A. CRUD on LogisticsItem (category: stationary)
        item_list_url = reverse('logistics-item-list')
        create_data = {
            'name': 'Dry Erase Markers',
            'category': 'stationary',
            'quantity': 50,
            'unit_cost': '2.50'
        }
        response = self.client.post(item_list_url, create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        item_id = response.data['id']
        self.assertEqual(response.data['name'], 'Dry Erase Markers')

        # Read
        item_detail_url = reverse('logistics-item-detail', kwargs={'pk': item_id})
        response = self.client.get(item_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 50)

        # Update
        update_data = {
            'name': 'Dry Erase Markers (Updated)',
            'category': 'stationary',
            'quantity': 60,
            'unit_cost': '2.75'
        }
        response = self.client.put(item_detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 60)
        self.assertEqual(response.data['name'], 'Dry Erase Markers (Updated)')

        # Delete
        response = self.client.delete(item_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # B. CRUD on Accommodation
        acc_list_url = reverse('accommodation-list')
        acc_create_data = {
            'name': 'Sylhet Training Hub',
            'location': 'Sylhet > Sylhet > Fenchuganj',
            'type': 'training_center',
            'room_type': 'single',
            'room_unit_cost': '50.00',
            'classroom_type': 'std_classroom',
            'classroom_unit_cost': '100.00',
            'has_wifi': True,
            'has_projector': True,
            'has_whiteboard': False,
            'has_dining': True
        }
        response = self.client.post(acc_list_url, acc_create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        acc_id = response.data['id']
        self.assertEqual(response.data['location'], 'Sylhet > Sylhet > Fenchuganj')
        self.assertTrue(response.data['has_wifi'])
        self.assertFalse(response.data['has_whiteboard'])

        # Read / Detail
        acc_detail_url = reverse('accommodation-detail', kwargs={'pk': acc_id})
        response = self.client.get(acc_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['location'], 'Sylhet > Sylhet > Fenchuganj')

        # Update
        acc_update_data = {
            'name': 'Sylhet Training Hub',
            'location': 'Sylhet > Sylhet > Balaganj',
            'type': 'training_center',
            'room_type': 'single',
            'room_unit_cost': '55.00',
            'classroom_type': 'std_classroom',
            'classroom_unit_cost': '100.00',
            'has_wifi': True,
            'has_projector': True,
            'has_whiteboard': True, # flipped
            'has_dining': True
        }
        response = self.client.put(acc_detail_url, acc_update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['location'], 'Sylhet > Sylhet > Balaganj')
        self.assertTrue(response.data['has_whiteboard'])

        # Delete
        response = self.client.delete(acc_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # C. CRUD on Transport
        trans_list_url = reverse('transport-list')
        trans_create_data = {
            'name': 'Bus #4',
            'type': 'bus',
            'capacity': 40,
            'unit_cost': '200.00'
        }
        response = self.client.post(trans_list_url, trans_create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        trans_id = response.data['id']

        # Read / Detail
        trans_detail_url = reverse('transport-detail', kwargs={'pk': trans_id})
        response = self.client.get(trans_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Update
        trans_update_data = {
            'name': 'Bus #4 (Premium)',
            'type': 'bus',
            'capacity': 40,
            'unit_cost': '250.00'
        }
        response = self.client.put(trans_detail_url, trans_update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unit_cost'], '250.00')

        # Delete
        response = self.client.delete(trans_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_super_admin_can_also_manage_logistics(self):
        """
        Super Admin users can access and manage all logistics registers.
        """
        self.client.force_authenticate(user=self.admin)
        url = reverse('logistics-item-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logistics_request_crud(self):
        """
        Trainers assigned to a batch can create, edit, read, and delete logistics requests.
        """
        from batches.models import Cohort, Batch
        cohort = Cohort.objects.create(cohort_code='TEST-COHORT', name='Test Cohort')
        batch = Batch.objects.create(
            batch_name='Test Batch',
            location='Dhaka > Dhaka',
            start_date='2026-10-15',
            cohort=cohort
        )
        
        # Create an item and accommodation properties
        item = LogisticsItem.objects.create(name='Pencils', category='stationary', quantity=100, unit_cost=0.50)
        acc = Accommodation.objects.create(name='BRAC Hub', type='training_center', room_unit_cost=50, classroom_unit_cost=100)

        # 1. Unassigned trainer tries to create request -> 403 Forbidden
        self.client.force_authenticate(user=self.trainer)
        url = reverse('logistics-request-list')
        data = {
            'batch': batch.id,
            'accommodation': acc.id,
            'check_in_date': '2026-10-15',
            'check_out_date': '2026-10-20',
            'num_trainers': 2,
            'items_input': [{'item_id': item.id, 'quantity': 10}]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Assigned trainer tries to create request -> 201 Created
        batch.trainers.add(self.trainer)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request_id = response.data['id']
        self.assertEqual(response.data['num_trainers'], 2)
        self.assertEqual(len(response.data['requested_items']), 1)

        # 3. Assigned trainer reads request detail
        detail_url = reverse('logistics-request-detail', kwargs={'pk': request_id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 4. Assigned trainer updates request (add new item, change quantity)
        item2 = LogisticsItem.objects.create(name='Notebooks', category='stationary', quantity=50, unit_cost=2.00)
        update_data = {
            'batch': batch.id,
            'accommodation': acc.id,
            'check_in_date': '2026-10-15',
            'check_out_date': '2026-10-20',
            'num_trainers': 3,
            'items_input': [
                {'item_id': item.id, 'quantity': 15},
                {'item_id': item2.id, 'quantity': 5}
            ]
        }
        response = self.client.put(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['num_trainers'], 3)
        self.assertEqual(len(response.data['requested_items']), 2)

        # 5. Delete request
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_logistics_request_invalid_items_input_fails(self):
        """
        LogisticsRequest creation fails with 400 if items_input references non-existent item or negative/zero quantity.
        """
        from batches.models import Cohort, Batch
        cohort = Cohort.objects.create(cohort_code='LOG-TEST-COHORT', name='Test Cohort')
        batch = Batch.objects.create(
            batch_name='Test Batch',
            location='Dhaka > Dhaka',
            start_date='2026-10-15',
            cohort=cohort
        )
        batch.trainers.add(self.trainer)
        self.client.force_authenticate(user=self.trainer)
        url = reverse('logistics-request-list')
        
        # Non-existent item
        data = {
            'batch': batch.id,
            'check_in_date': '2026-10-15',
            'check_out_date': '2026-10-20',
            'num_trainers': 2,
            'items_input': [{'item_id': 9999, 'quantity': 10}]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Negative quantity
        item = LogisticsItem.objects.create(name='Pencils', category='stationary', quantity=100, unit_cost=0.50)
        data['items_input'] = [{'item_id': item.id, 'quantity': -5}]
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Zero quantity
        data['items_input'] = [{'item_id': item.id, 'quantity': 0}]
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_trainer_cannot_assign_request_to_unassigned_batch(self):
        """
        Trainer cannot assign a logistics request to a batch they are not assigned to.
        """
        from batches.models import Cohort, Batch
        cohort = Cohort.objects.create(cohort_code='LOG-TEST-COHORT-2', name='Test Cohort 2')
        batch_assigned = Batch.objects.create(
            batch_name='Assigned Batch',
            location='Dhaka > Dhaka',
            start_date='2026-10-15',
            cohort=cohort
        )
        batch_unassigned = Batch.objects.create(
            batch_name='Unassigned Batch',
            location='Dhaka > Dhaka',
            start_date='2026-10-15',
            cohort=cohort
        )
        batch_assigned.trainers.add(self.trainer)
        
        self.client.force_authenticate(user=self.trainer)
        url = reverse('logistics-request-list')
        
        # Attempt to create with unassigned batch -> 403 Forbidden
        data = {
            'batch': batch_unassigned.id,
            'check_in_date': '2026-10-15',
            'check_out_date': '2026-10-20',
            'num_trainers': 2,
            'items_input': []
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)
        
        # Create valid request first
        data['batch'] = batch_assigned.id
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request_id = response.data['id']
        
        # Attempt to update (PUT) batch to unassigned batch -> 403 Forbidden
        detail_url = reverse('logistics-request-detail', kwargs={'pk': request_id})
        data['batch'] = batch_unassigned.id
        response = self.client.put(detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("detail", response.data)


