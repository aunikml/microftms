from django.urls import path, include
from rest_framework.routers import DefaultRouter
from logistics.views import LogisticsItemViewSet, AccommodationViewSet, TransportViewSet, LogisticsRequestViewSet

router = DefaultRouter()
router.register(r'items', LogisticsItemViewSet, basename='logistics-item')
router.register(r'accommodations', AccommodationViewSet, basename='accommodation')
router.register(r'transports', TransportViewSet, basename='transport')
router.register(r'requests', LogisticsRequestViewSet, basename='logistics-request')

urlpatterns = [
    path('', include(router.urls)),
]
