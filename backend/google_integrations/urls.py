from django.urls import path, include
from rest_framework.routers import DefaultRouter
from google_integrations.views import GoogleIntegrationConfigViewSet, GoogleOAuthViewSet

router = DefaultRouter()
router.register(r'config', GoogleIntegrationConfigViewSet, basename='google-config')
router.register(r'oauth', GoogleOAuthViewSet, basename='google-oauth')

urlpatterns = [
    path('', include(router.urls)),
]
