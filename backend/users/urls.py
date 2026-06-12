from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import (
    CustomTokenObtainPairView,
    ChangePasswordView,
    UserProfileView,
    UserViewSet
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    path('', include(router.urls)),
]
