from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import redirect
from django.core import signing
from django.contrib.auth import get_user_model
from django.utils import timezone
from google_auth_oauthlib.flow import Flow
from google_integrations.models import GoogleIntegrationConfig, GoogleUserToken, GoogleCalendarEventSync
from google_integrations.helper import publish_batch_event, delete_batch_event, is_google_configured, get_google_config
from batches.models import Batch
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
User = get_user_model()

class GoogleIntegrationConfigViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # Allow any logged-in user to check config status
        if self.action == 'status_check':
            return [permissions.IsAuthenticated()]
        # Only Super Admin can manage credentials
        return [permissions.IsAuthenticated(), permissions.IsAdminUser]

    @action(detail=False, methods=['get'], url_path='status-check')
    def status_check(self, request):
        return Response({
            "is_configured": is_google_configured()
        })

    @action(detail=False, methods=['get'], url_path='get-credentials')
    def get_credentials(self, request):
        config = get_google_config()
        if not config:
            return Response({"client_id": "", "client_secret": ""})
        return Response({
            "client_id": config.client_id,
            "client_secret": config.client_secret
        })

    @action(detail=False, methods=['post'], url_path='save-credentials')
    def save_credentials(self, request):
        client_id = request.data.get('client_id', '').strip()
        client_secret = request.data.get('client_secret', '').strip()

        if not client_id or not client_secret:
            return Response(
                {"error": "Both client_id and client_secret are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        config, created = GoogleIntegrationConfig.objects.get_or_create(
            id=1,
            defaults={'client_id': client_id, 'client_secret': client_secret}
        )
        if not created:
            config.client_id = client_id
            config.client_secret = client_secret
            config.save()

        return Response({
            "message": "Google Integration Credentials saved successfully",
            "is_configured": True
        })

class GoogleOAuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # Callback is accessed anonymously from Google browser redirect
        if self.action == 'oauth2_callback':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='auth-url')
    def auth_url(self, request):
        if not is_google_configured():
            return Response(
                {"error": "Google Calendar Integration is not configured by the Administrator"},
                status=status.HTTP_400_BAD_REQUEST
            )

        batch_id = request.query_params.get('batch_id')
        config = get_google_config()

        # Sign the user details in state to verify securely in callback
        state_payload = {
            "user_id": request.user.id
        }
        if batch_id:
            state_payload["batch_id"] = batch_id

        signed_state = signing.dumps(state_payload)
        
        # Build OAuth Flow redirect URI pointing back to our API
        redirect_uri = request.build_absolute_uri('/api/google-integrations/oauth/oauth2callback/')
        
        client_config = {
            "web": {
                "client_id": config.client_id,
                "client_secret": config.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        }

        flow = Flow.from_client_config(
            client_config,
            scopes=['https://www.googleapis.com/auth/calendar.events'],
            redirect_uri=redirect_uri
        )

        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            prompt='consent',
            state=signed_state
        )

        return Response({
            "authorization_url": authorization_url
        })

    @action(detail=False, methods=['get'], url_path='oauth2callback')
    def oauth2_callback(self, request):
        code = request.GET.get('code')
        state = request.GET.get('state')

        if not code or not state:
            return redirect('http://localhost:5173/calendar?google_error=missing_params')

        try:
            # Verify and decode state signature
            state_payload = signing.loads(state, max_age=1800) # 30 mins limit
            user_id = state_payload.get('user_id')
            batch_id = state_payload.get('batch_id')
            
            user = User.objects.get(id=user_id)
        except Exception as e:
            logger.error(f"Failed to verify state in oauth callback: {e}")
            return redirect('http://localhost:5173/calendar?google_error=invalid_state')

        config = get_google_config()
        redirect_uri = request.build_absolute_uri('/api/google-integrations/oauth/oauth2callback/')
        
        client_config = {
            "web": {
                "client_id": config.client_id,
                "client_secret": config.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri],
            }
        }

        try:
            flow = Flow.from_client_config(
                client_config,
                scopes=['https://www.googleapis.com/auth/calendar.events'],
                redirect_uri=redirect_uri
            )
            flow.fetch_token(code=code)
            credentials = flow.credentials

            # Save tokens to database mapping
            token_obj, created = GoogleUserToken.objects.get_or_create(
                user=user,
                defaults={
                    'access_token': credentials.token,
                    'refresh_token': credentials.refresh_token or '',
                    'token_expiry': credentials.expiry
                }
            )
            if not created:
                token_obj.access_token = credentials.token
                if credentials.refresh_token:
                    token_obj.refresh_token = credentials.refresh_token
                token_obj.token_expiry = credentials.expiry
                token_obj.save()

            # --- Retroactive Sync ---
            # Automatically publish future/active batches this user is assigned to
            assigned_batches = user.batches.filter(
                status__in=['active', 'inactive'],
                start_date__gte=timezone.now().date()
            )
            synced_count = 0
            for b in assigned_batches:
                event_id = publish_batch_event(user, b)
                if event_id:
                    synced_count += 1

            logger.info(f"Retroactively synced {synced_count} future batches for user {user.email}")

            # Redirect back to frontend details page
            frontend_redirect = 'http://localhost:5173/calendar?google_success=true'
            if batch_id:
                frontend_redirect = f'http://localhost:5173/batches/{batch_id}?google_success=true'
            
            return redirect(frontend_redirect)

        except Exception as e:
            logger.error(f"Error during OAuth code exchange: {e}")
            return redirect('http://localhost:5173/calendar?google_error=auth_failed')

    @action(detail=False, methods=['get'], url_path='connection-status')
    def connection_status(self, request):
        is_linked = GoogleUserToken.objects.filter(user=request.user).exists()
        return Response({
            "is_linked": is_linked,
            "email": request.user.email if is_linked else None
        })

    @action(detail=False, methods=['post'], url_path='disconnect')
    def disconnect(self, request):
        try:
            token = GoogleUserToken.objects.get(user=request.user)
            # Find and delete all sync records locally
            GoogleCalendarEventSync.objects.filter(user=request.user).delete()
            token.delete()
            return Response({"message": "Google Account unlinked successfully"})
        except GoogleUserToken.DoesNotExist:
            return Response(
                {"error": "No Google Account link found for this user"},
                status=status.HTTP_400_BAD_REQUEST
            )
