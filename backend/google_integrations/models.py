from django.db import models
from django.conf import settings

class GoogleIntegrationConfig(models.Model):
    client_id = models.CharField(max_length=255)
    client_secret = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Google OAuth Credentials Settings"

    class Meta:
        verbose_name = "Google Integration Config"
        verbose_name_plural = "Google Integration Config"

class GoogleUserToken(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='google_token'
    )
    access_token = models.TextField()
    refresh_token = models.TextField()
    token_expiry = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Google Token for {self.user.email}"

class GoogleCalendarEventSync(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='google_event_syncs'
    )
    batch = models.ForeignKey(
        'batches.Batch',
        on_delete=models.CASCADE,
        related_name='google_event_syncs'
    )
    google_event_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'batch')
        verbose_name = "Google Calendar Event Sync"
        verbose_name_plural = "Google Calendar Event Syncs"

    def __str__(self):
        return f"Event Sync for {self.user.email} - {self.batch.batch_name} ({self.google_event_id})"
