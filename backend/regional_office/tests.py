from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User, UserRole
from regional_office.models import RegionalOffice, Division

class RegionalOfficeTests(APITestCase):
    def setUp(self):
        # Create users of different roles
        self.super_admin = User.objects.create_superuser(
            email='admin@test.com',
            first_name='Super',
            last_name='Admin',
            password='testpassword'
        )
        self.super_admin.is_password_changed = True
        self.super_admin.save()

        self.supervisor = User.objects.create_user(
            email='supervisor@test.com',
            first_name='Sarah',
            last_name='Supervisor',
            role=UserRole.PROGRAM_SUPERVISOR,
            password='testpassword'
        )
        self.supervisor.is_password_changed = True
        self.supervisor.save()

        self.regional_manager1 = User.objects.create_user(
            email='rm1@test.com',
            first_name='Ray',
            last_name='Manager',
            role=UserRole.REGIONAL_MANAGER,
            password='testpassword'
        )
        self.regional_manager1.is_password_changed = True
        self.regional_manager1.save()

        self.regional_manager2 = User.objects.create_user(
            email='rm2@test.com',
            first_name='Rob',
            last_name='Manager',
            role=UserRole.REGIONAL_MANAGER,
            password='testpassword'
        )
        self.regional_manager2.is_password_changed = True
        self.regional_manager2.save()

        # Create Divisions
        self.div_dhaka = Division.objects.create(name='Dhaka', included_regions=['Dhaka', 'Gazipur'])
        self.div_ctg = Division.objects.create(name='Chattogram', included_regions=['Chattogram', 'Cox\'s Bazar'])
        self.div_sylhet = Division.objects.create(name='Sylhet', included_regions=['Sylhet', 'Moulvibazar'])

        self.list_url = reverse('regional-office-list')
        self.division_list_url = reverse('division-list')

    def test_super_admin_can_crud_division(self):
        self.client.force_authenticate(user=self.super_admin)
        
        # Create Division
        data = {
            'name': 'Rajshahi',
            'included_regions': ['Rajshahi', 'Bogra']
        }
        response = self.client.post(self.division_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Division.objects.count(), 4)
        
        div_id = response.data['id']
        detail_url = reverse('division-detail', kwargs={'pk': div_id})
        
        # Read
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Rajshahi')
        
        # Update
        updated_data = {
            'name': 'Rajshahi Division',
            'included_regions': ['Rajshahi', 'Bogra', 'Pabna']
        }
        response = self.client.put(detail_url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Division.objects.get(id=div_id).name, 'Rajshahi Division')
        self.assertEqual(len(Division.objects.get(id=div_id).included_regions), 3)
        
        # Delete
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Division.objects.count(), 3)

    def test_unauthorized_user_cannot_create_division(self):
        self.client.force_authenticate(user=self.supervisor)
        data = {
            'name': 'Khulna',
            'included_regions': ['Khulna']
        }
        response = self.client.post(self.division_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_super_admin_can_crud_regional_office(self):
        self.client.force_authenticate(user=self.super_admin)
        
        # Create (using 'Dhaka' which is in included_regions)
        data = {
            'name': 'Dhaka Central',
            'division': self.div_dhaka.id,
            'location': 'Dhaka',
            'regional_managers': [self.regional_manager1.id, self.regional_manager2.id]
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RegionalOffice.objects.count(), 1)
        
        ro_id = response.data['id']
        detail_url = reverse('regional-office-detail', kwargs={'pk': ro_id})
        
        # Read
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['regional_managers_details']), 2)
        self.assertEqual(response.data['division_details']['name'], 'Dhaka')
        
        # Update (using 'Gazipur' which is in included_regions)
        updated_data = {
            'name': 'Dhaka North',
            'division': self.div_dhaka.id,
            'location': 'Gazipur',
            'regional_managers': [self.regional_manager1.id]
        }
        response = self.client.put(detail_url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(RegionalOffice.objects.get(id=ro_id).name, 'Dhaka North')
        self.assertEqual(RegionalOffice.objects.get(id=ro_id).regional_managers.count(), 1)
        
        # Delete
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(RegionalOffice.objects.count(), 0)

    def test_unauthorized_user_cannot_create_regional_office(self):
        self.client.force_authenticate(user=self.supervisor)
        data = {
            'name': 'Chittagong South',
            'division': self.div_ctg.id,
            'location': 'Chattogram',
            'regional_managers': []
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(RegionalOffice.objects.count(), 0)

    def test_non_regional_manager_role_fails_validation(self):
        self.client.force_authenticate(user=self.super_admin)
        # Attempt to add supervisor as a regional manager
        data = {
            'name': 'Sylhet Main',
            'division': self.div_sylhet.id,
            'location': 'Sylhet',
            'regional_managers': [self.supervisor.id]
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('regional_managers', response.data)

    def test_create_regional_office_invalid_location_fails(self):
        self.client.force_authenticate(user=self.super_admin)
        # Location 'Invalid Location' is not in div_dhaka.included_regions
        data = {
            'name': 'Dhaka Central',
            'division': self.div_dhaka.id,
            'location': 'Invalid Location',
            'regional_managers': []
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('location', response.data)

    def test_filtering_by_division_and_name(self):
        self.client.force_authenticate(user=self.super_admin)
        
        ro1 = RegionalOffice.objects.create(name='Dhaka Office A', division=self.div_dhaka, location='Dhaka')
        ro2 = RegionalOffice.objects.create(name='Dhaka Office B', division=self.div_dhaka, location='Gazipur')
        ro3 = RegionalOffice.objects.create(name='Chittagong Office', division=self.div_ctg, location='Chattogram')
        
        # Filter by division string (case-insensitive name)
        response = self.client.get(self.list_url, {'division': 'Dhaka'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Filter by division ID
        response = self.client.get(self.list_url, {'division': str(self.div_dhaka.id)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Filter by division case-insensitive
        response = self.client.get(self.list_url, {'division': 'dhaka'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Filter by name
        response = self.client.get(self.list_url, {'name': 'office B'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Dhaka Office B')

    def test_get_locations_endpoint(self):
        self.client.force_authenticate(user=self.super_admin)
        url = reverse('division-get-locations')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreater(len(response.data), 0)
        self.assertIn('Abhaynagar (Jashore)', response.data)

    def test_partial_update_invalid_location_fails(self):
        """
        PATCH updating only location to an invalid location not included in current division's regions fails.
        """
        self.client.force_authenticate(user=self.super_admin)
        ro = RegionalOffice.objects.create(name='Dhaka Central', division=self.div_dhaka, location='Dhaka')
        detail_url = reverse('regional-office-detail', kwargs={'pk': ro.id})
        
        # 'Sylhet' is in div_sylhet but not in div_dhaka
        response = self.client.patch(detail_url, {'location': 'Sylhet'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('location', response.data)

    def test_partial_update_invalid_division_fails(self):
        """
        PATCH updating only division to a division that doesn't include the current location fails.
        """
        self.client.force_authenticate(user=self.super_admin)
        ro = RegionalOffice.objects.create(name='Dhaka Central', division=self.div_dhaka, location='Dhaka')
        detail_url = reverse('regional-office-detail', kwargs={'pk': ro.id})
        
        # div_sylhet does not contain 'Dhaka'
        response = self.client.patch(detail_url, {'division': self.div_sylhet.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('location', response.data)

    def test_partial_update_valid_succeeds(self):
        """
        PATCH updating with valid details succeeds.
        """
        self.client.force_authenticate(user=self.super_admin)
        ro = RegionalOffice.objects.create(name='Dhaka Central', division=self.div_dhaka, location='Dhaka')
        detail_url = reverse('regional-office-detail', kwargs={'pk': ro.id})
        
        # 'Gazipur' is in div_dhaka.included_regions
        response = self.client.patch(detail_url, {'location': 'Gazipur'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ro.refresh_from_db()
        self.assertEqual(ro.location, 'Gazipur')

