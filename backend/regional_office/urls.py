from django.urls import path, include
from rest_framework.routers import DefaultRouter
from regional_office.views import RegionalOfficeViewSet, DivisionViewSet

router = DefaultRouter()
router.register(r'divisions', DivisionViewSet, basename='division')
router.register(r'', RegionalOfficeViewSet, basename='regional-office')

urlpatterns = [
    path('', include(router.urls)),
]
