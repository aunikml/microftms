from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch, MagicMock
from datetime import date, timedelta, datetime
from users.models import User
from batches.models import Batch, Cohort
from google_integrations.models import GoogleIntegrationConfig, GoogleUserToken, GoogleCalendarEventSync
from google_integrations.helper import get_user_credentials, publish_batch_event, delete_batch_event

class GoogleIntegrationsTestCase(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            email='trainer_test@tms.com',
            first_name='Trainer',
            last_name='Test',
            password='testpassword'
        )
        
        # Create Google credentials config
        self.config = GoogleIntegrationConfig.objects.create(
            client_id='test-client-id',
            client_secret='test-client-secret'
        )
        
        # Create user token with timezone-aware expiry
        aware_expiry = timezone.now() + timedelta(hours=1)
        self.user_token = GoogleUserToken.objects.create(
            user=self.user,
            access_token='test-access-token',
            refresh_token='test-refresh-token',
            token_expiry=aware_expiry
        )
        
        # Create a cohort and a batch
        self.cohort = Cohort.objects.create(
            cohort_code='COH-TEST',
            name='Test Cohort'
        )
        self.batch = Batch.objects.create(
            batch_name='Test Batch',
            location='Dhaka > HQ',
            start_date=date(2026, 6, 15),
            cohort=self.cohort,
            status='active'
        )

    def test_get_user_credentials_naive_expiry(self):
        """
        Verify that get_user_credentials converts the timezone-aware token_expiry
        to a naive UTC datetime and does not crash during credentials.expired comparison.
        """
        credentials = get_user_credentials(self.user)
        self.assertIsNotNone(credentials)
        self.assertEqual(credentials.token, 'test-access-token')
        self.assertEqual(credentials.refresh_token, 'test-refresh-token')
        
        # The expiry should be timezone-naive (tzinfo is None)
        self.assertIsNone(credentials.expiry.tzinfo)
        # Should correctly not crash on calling expired
        self.assertFalse(credentials.expired)

    @patch('google_integrations.helper.build')
    def test_publish_batch_event_formatting(self, mock_build):
        """
        Verify that publish_batch_event prepares the event body using start_date + 1 day
        for the end date, and does not include a timeZone key under start/end.
        """
        # Mock Google API services
        mock_service = MagicMock()
        mock_events = MagicMock()
        mock_insert = MagicMock()
        
        mock_build.return_value = mock_service
        mock_service.events.return_value = mock_events
        mock_events.insert.return_value = mock_insert
        mock_insert.execute.return_value = {'id': 'mocked-google-event-id'}
        
        event_id = publish_batch_event(self.user, self.batch)
        
        self.assertEqual(event_id, 'mocked-google-event-id')
        
        # Check that insert was called with start_date and start_date + 1 day
        mock_events.insert.assert_called_once()
        kwargs = mock_events.insert.call_args[1]
        event_body = kwargs['body']
        
        self.assertEqual(event_body['start']['date'], '2026-06-15')
        self.assertEqual(event_body['end']['date'], '2026-06-16')
        
        # Verify no timeZone key is passed inside start or end objects for all-day events
        self.assertNotIn('timeZone', event_body['start'])
        self.assertNotIn('timeZone', event_body['end'])
        
        # Verify colorId is set correctly (10 for active)
        self.assertEqual(event_body['colorId'], '10')

    @patch('google_integrations.helper.build')
    def test_delete_batch_event(self, mock_build):
        """
        Verify that delete_batch_event successfully deletes local sync records and deletes from Google.
        """
        # Create a sync record
        sync = GoogleCalendarEventSync.objects.create(
            user=self.user,
            batch=self.batch,
            google_event_id='event-123'
        )
        
        # Mock Google API
        mock_service = MagicMock()
        mock_events = MagicMock()
        mock_delete = MagicMock()
        
        mock_build.return_value = mock_service
        mock_service.events.return_value = mock_events
        mock_events.delete.return_value = mock_delete
        mock_delete.execute.return_value = {}
        
        result = delete_batch_event(self.user, self.batch)
        self.assertTrue(result)
        
        # Verify local sync record is deleted
        self.assertFalse(GoogleCalendarEventSync.objects.filter(user=self.user, batch=self.batch).exists())
        
        # Verify Google delete was called with correct arguments
        mock_events.delete.assert_called_once_with(
            calendarId='primary',
            eventId='event-123'
        )
