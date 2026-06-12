from django.urls import path, include
from rest_framework.routers import DefaultRouter
from batches.views import CohortViewSet, BatchViewSet, ParticipantViewSet, BatchStageViewSet

router = DefaultRouter()
router.register(r'cohorts', CohortViewSet, basename='cohort')
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'participants', ParticipantViewSet, basename='participant')
router.register(r'batch-stages', BatchStageViewSet, basename='batch-stage')

urlpatterns = [
    path('', include(router.urls)),
]

