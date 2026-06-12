from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from users.permissions import IsPasswordChanged, IsLogisticManager
from users.models import UserRole
from batches.permissions import IsAssignedTrainerOrManager
from logistics.models import LogisticsItem, Accommodation, Transport, LogisticsRequest
from logistics.serializers import LogisticsItemSerializer, AccommodationSerializer, TransportSerializer, LogisticsRequestSerializer

class LogisticsItemViewSet(viewsets.ModelViewSet):
    queryset = LogisticsItem.objects.all().order_by('-created_at')
    serializer_class = LogisticsItemSerializer
    permission_classes = [IsAuthenticated, IsPasswordChanged, IsLogisticManager]

class AccommodationViewSet(viewsets.ModelViewSet):
    queryset = Accommodation.objects.all().order_by('-created_at')
    serializer_class = AccommodationSerializer
    permission_classes = [IsAuthenticated, IsPasswordChanged, IsLogisticManager]

class TransportViewSet(viewsets.ModelViewSet):
    queryset = Transport.objects.all().order_by('-created_at')
    serializer_class = TransportSerializer
    permission_classes = [IsAuthenticated, IsPasswordChanged, IsLogisticManager]


class LogisticsRequestViewSet(viewsets.ModelViewSet):
    queryset = LogisticsRequest.objects.all().order_by('-created_at')
    serializer_class = LogisticsRequestSerializer
    permission_classes = [IsAuthenticated, IsPasswordChanged, IsAssignedTrainerOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.SUPER_ADMIN, UserRole.PROGRAM_SUPERVISOR, UserRole.BATCH_MANAGER, UserRole.LOGISTIC_MANAGER, UserRole.REGIONAL_MANAGER] or user.is_superuser:
            qs = LogisticsRequest.objects.all()
        elif user.role in [UserRole.TRAINER, UserRole.MASTER_TRAINER]:
            qs = LogisticsRequest.objects.filter(batch__trainers=user)
        else:
            qs = LogisticsRequest.objects.none()

        batch_id = self.request.query_params.get('batch')
        if batch_id:
            qs = qs.filter(batch_id=batch_id)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        batch = serializer.validated_data['batch']
        if user.role in [UserRole.TRAINER, UserRole.MASTER_TRAINER]:
            if not batch.trainers.filter(id=user.id).exists():
                raise PermissionDenied("You are not assigned as an instructor to this batch.")
        serializer.save(created_by=user)

