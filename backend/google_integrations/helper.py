from datetime import datetime, timezone, timedelta
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from django.utils import timezone as django_timezone
from google_integrations.models import GoogleIntegrationConfig, GoogleUserToken, GoogleCalendarEventSync
import logging

logger = logging.getLogger(__name__)

def get_google_config():
    return GoogleIntegrationConfig.objects.first()

def is_google_configured():
    config = get_google_config()
    return bool(config and config.client_id and config.client_secret)

def get_user_credentials(user):
    try:
        user_token = GoogleUserToken.objects.get(user=user)
    except GoogleUserToken.DoesNotExist:
        return None

    config = get_google_config()
    if not config:
        return None

    expiry = user_token.token_expiry
    if expiry and expiry.tzinfo is not None:
        expiry = expiry.astimezone(timezone.utc).replace(tzinfo=None)

    credentials = Credentials(
        token=user_token.access_token,
        refresh_token=user_token.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=config.client_id,
        client_secret=config.client_secret,
        expiry=expiry
    )

    if credentials.expired:
        try:
            credentials.refresh(Request())
            # Save refreshed credentials
            user_token.access_token = credentials.token
            if credentials.expiry:
                user_token.token_expiry = credentials.expiry
            user_token.save()
        except Exception as e:
            logger.error(f"Error refreshing google access token for user {user.email}: {e}")
            return None

    return credentials

def publish_batch_event(user, batch):
    """
    Publishes the start date of a batch as an all-day event in the user's primary Google Calendar.
    Stores the sync event ID.
    """
    credentials = get_user_credentials(user)
    if not credentials:
        logger.warning(f"Could not load google credentials for trainer {user.email}")
        return None

    # Check if already synced
    sync, created = GoogleCalendarEventSync.objects.get_or_create(
        user=user,
        batch=batch,
        defaults={'google_event_id': 'PENDING'}
    )

    # Prepare event details
    start_date_str = str(batch.start_date)
    end_date_str = str(batch.start_date + timedelta(days=1))
    event_body = {
        'summary': f"Batch Starts: {batch.batch_name}",
        'description': (
            f"Cohort: {batch.cohort.name} ({batch.cohort.cohort_code})\n"
            f"Location: {batch.location.replace(' > ', ' • ')}\n"
            f"Trainees Enrolled: {batch.participants.count()}\n"
            f"Batch Profile: http://localhost:5173/batches/{batch.id}"
        ),
        'start': {
            'date': start_date_str,
        },
        'end': {
            'date': end_date_str,
        },
        # Color categories: 10 is Green (active), 1 is Blue (completed), 8 is Grey (inactive)
        'colorId': '10' if batch.status == 'active' else '1' if batch.status == 'completed' else '8',
    }

    try:
        service = build('calendar', 'v3', credentials=credentials)
        if not created and sync.google_event_id != 'PENDING':
            # Event already exists, let's update it to ensure it matches current info
            event = service.events().update(
                calendarId='primary',
                eventId=sync.google_event_id,
                body=event_body
            ).execute()
        else:
            # Create a new event
            event = service.events().insert(
                calendarId='primary',
                body=event_body
            ).execute()
            sync.google_event_id = event['id']
            sync.save()

        return event['id']
    except Exception as e:
        logger.error(f"Failed to publish event to google calendar for user {user.email}, batch {batch.id}: {e}")
        # If it failed and was newly created as PENDING, delete the pending record
        if created:
            sync.delete()
        return None

def delete_batch_event(user, batch):
    """
    Deletes the batch start date event from the user's primary Google Calendar using the sync ID.
    """
    try:
        sync = GoogleCalendarEventSync.objects.get(user=user, batch=batch)
    except GoogleCalendarEventSync.DoesNotExist:
        return False

    credentials = get_user_credentials(user)
    if not credentials:
        # Just delete the local sync record since we cannot authenticate
        sync.delete()
        return False

    try:
        service = build('calendar', 'v3', credentials=credentials)
        service.events().delete(
            calendarId='primary',
            eventId=sync.google_event_id
        ).execute()
        sync.delete()
        return True
    except Exception as e:
        logger.error(f"Failed to delete event from google calendar for user {user.email}, event {sync.google_event_id}: {e}")
        # Still delete local sync record to prevent stuck state
        sync.delete()
        return False
