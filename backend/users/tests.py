from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User, UserRole

class UserModelTests(TestCase):
    def test_create_user_with_default_password(self):
        """
        Creating a user without a password sets the password to their email
        and defaults is_password_changed to False.
        """
        user = User.objects.create_user(
            email='trainer@tms.com',
            first_name='Trainer',
            last_name='User',
            role=UserRole.TRAINER
        )
        self.assertEqual(user.email, 'trainer@tms.com')
        self.assertTrue(user.check_password('trainer@tms.com'))
        self.assertFalse(user.is_password_changed)
        self.assertEqual(user.role, UserRole.TRAINER)

    def test_create_superuser(self):
        """
        Creating a superuser sets is_password_changed to True and role to SUPER_ADMIN.
        """
        admin = User.objects.create_superuser(
            email='admin@tms.com',
            first_name='Admin',
            last_name='User',
            password='adminpassword'
        )
        self.assertEqual(admin.role, UserRole.SUPER_ADMIN)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_password_changed)


class AuthAPITests(APITestCase):
    def setUp(self):
        # Create a user with password=email (not changed)
        self.user = User.objects.create_user(
            email='testuser@tms.com',
            first_name='Test',
            last_name='User',
            role=UserRole.TRAINER
        )
        
        # Create a superuser with password changed
        self.admin = User.objects.create_superuser(
            email='admin@tms.com',
            first_name='Admin',
            last_name='User',
            password='adminpassword'
        )

    def test_login_success_and_payload(self):
        """
        Logging in returns JWT and user role/password status.
        """
        url = reverse('token_obtain_pair')
        data = {
            'email': 'testuser@tms.com',
            'password': 'testuser@tms.com'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], UserRole.TRAINER)
        self.assertFalse(response.data['user']['is_password_changed'])

    def test_change_password_and_unblocks_access(self):
        """
        Changing the password successfully updates is_password_changed to True.
        """
        # Obtain token
        login_url = reverse('token_obtain_pair')
        login_data = {
            'email': 'testuser@tms.com',
            'password': 'testuser@tms.com'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        access_token = login_response.data['access']
        
        # Access with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # 1. Verify that user management (users list) returns HTTP 403 because we haven't changed password
        users_list_url = reverse('user-list')
        response = self.client.get(users_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # 2. Change password
        change_pass_url = reverse('change_password')
        change_data = {
            'old_password': 'testuser@tms.com',
            'new_password': 'NewSecurePassword123'
        }
        response = self.client.post(change_pass_url, change_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Reload user status and check is_password_changed is True
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_password_changed)
        
        # 4. Try listing users (Should not get 403 Forbidden due to password changed check)
        # Note: listing users requires IsPasswordChanged. A normal trainer might not have access to view users list, but we can verify it doesn't fail on IsPasswordChanged.
        # Wait, UserViewSet.get_permissions: list requires [IsAuthenticated, IsPasswordChanged]
        # So yes, trainer CAN list users.
        response = self.client.get(users_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_user_crud(self):
        """
        Super admin can create new users, standard users cannot.
        """
        # Log in as admin
        self.client.force_authenticate(user=self.admin)
        
        url = reverse('user-list')
        data = {
            'email': 'newtrainer@tms.com',
            'first_name': 'New',
            'last_name': 'Trainer',
            'role': UserRole.TRAINER
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'newtrainer@tms.com')
        
        # Log in as trainer
        self.client.force_authenticate(user=self.user)
        # Force set password changed to avoid 403 on IsPasswordChanged
        self.user.is_password_changed = True
        self.user.save()
        
        response = self.client.post(url, data, format='json')
        # Standard trainer cannot create users
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
