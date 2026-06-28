import csv
import io
import logging

logger = logging.getLogger(__name__)
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsPasswordChanged, IsRole
from users.models import User, UserRole
from batches.models import Cohort, Batch, Participant, Attendance, BatchStage
from batches.serializers import CohortSerializer, BatchSerializer, ParticipantSerializer, AttendanceSerializer, BatchStageSerializer
from batches.permissions import IsAssignedTrainerOrManager

# Custom permission: Admin, Supervisor, or Batch Manager
class IsTraineeManager(IsRole):
    allowed_roles = [UserRole.PROGRAM_SUPERVISOR, UserRole.BATCH_MANAGER, UserRole.REGIONAL_MANAGER]

class CohortViewSet(viewsets.ModelViewSet):
    queryset = Cohort.objects.all().order_by('cohort_code')
    serializer_class = CohortSerializer

    def get_permissions(self):
        # CRUD requires Admin/Supervisor/Batch Manager, authenticated otherwise
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsPasswordChanged(), IsTraineeManager()]
        return [IsAuthenticated(), IsPasswordChanged()]

class BatchViewSet(viewsets.ModelViewSet):
    serializer_class = BatchSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Batch.objects.none()
        if user.role in [UserRole.TRAINER, UserRole.MASTER_TRAINER]:
            return Batch.objects.filter(trainers=user).order_by('-start_date')
        return Batch.objects.all().order_by('-start_date')


    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'add_participant', 'upload_participants', 'assign_trainer', 'remove_trainer']:
            return [IsAuthenticated(), IsPasswordChanged(), IsTraineeManager()]
        elif self.action in ['get_attendance', 'save_attendance']:
            return [IsAuthenticated(), IsPasswordChanged(), IsAssignedTrainerOrManager()]
        return [IsAuthenticated(), IsPasswordChanged()]

    @action(detail=True, methods=['get'])
    def get_attendance(self, request, pk=None):
        batch = self.get_object()
        date_str = request.query_params.get('date')
        stage_id = request.query_params.get('stage')
        if not date_str:
            return Response({"detail": "Missing date query parameter (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        
        records = Attendance.objects.filter(batch=batch, date=date_str)
        if stage_id:
            records = records.filter(stage_id=stage_id)
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def save_attendance(self, request, pk=None):
        batch = self.get_object()
        date_str = request.data.get('date')
        records_data = request.data.get('records')
        stage_id = request.data.get('stage')
        
        if not date_str or records_data is None:
            return Response({"detail": "Missing date or records parameter."}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.db import transaction
        
        try:
            with transaction.atomic():
                saved_records = []
                for item in records_data:
                    p_id = item.get('participant_id')
                    status_val = item.get('status')
                    
                    if not p_id or not status_val:
                        raise ValueError("Each record must contain participant_id and status.")
                        
                    if status_val not in Attendance.StatusChoices.values:
                        raise ValueError(f"Invalid status '{status_val}'. Choices are: present, absent, late.")
                        
                    try:
                        participant = Participant.objects.get(id=p_id, batch=batch)
                    except Participant.DoesNotExist:
                        raise ValueError(f"Participant with ID {p_id} does not exist in this batch.")
                        
                    attendance_rec, _ = Attendance.objects.update_or_create(
                        batch=batch,
                        participant=participant,
                        date=date_str,
                        defaults={
                            'status': status_val,
                            'marked_by': request.user,
                            'stage_id': stage_id
                        }
                    )
                    saved_records.append(attendance_rec)
                
                serializer = AttendanceSerializer(saved_records, many=True)
                return Response({
                    "detail": "Attendance saved successfully.",
                    "records": serializer.data
                }, status=status.HTTP_200_OK)
                
        except ValueError as val_err:
            return Response({"detail": str(val_err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Failed to save attendance: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=['post'])
    def assign_trainer(self, request, pk=None):
        batch = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"detail": "Missing user_id parameter."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if user.role not in [UserRole.TRAINER, UserRole.MASTER_TRAINER]:
            return Response({"detail": "User is not a Trainer or Master Trainer."}, status=status.HTTP_400_BAD_REQUEST)
            
        batch.trainers.add(user)
        
        # Trigger Google Calendar Sync automatically if trainer has Google OAuth linked
        try:
            from google_integrations.helper import publish_batch_event
            publish_batch_event(user, batch)
        except Exception as sync_err:
            logger.error(f"Failed to auto-sync batch calendar event for assigned trainer: {sync_err}")
            
        from users.serializers import UserSerializer
        return Response({
            "detail": f"Trainer {user.full_name} assigned successfully.",
            "trainer": UserSerializer(user).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def remove_trainer(self, request, pk=None):
        batch = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"detail": "Missing user_id parameter."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            
        # Trigger Google Calendar Sync deletion automatically before removing the trainer relationship
        try:
            from google_integrations.helper import delete_batch_event
            delete_batch_event(user, batch)
        except Exception as sync_err:
            logger.error(f"Failed to auto-delete calendar event for unassigned trainer: {sync_err}")
            
        batch.trainers.remove(user)
        return Response({"detail": f"Trainer {user.full_name} removed successfully."}, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        batch = self.get_object()
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')

        if not first_name or not last_name or not email:
            return Response({"detail": "Missing required fields (first_name, last_name, email)."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if email already exists in this batch
        if Participant.objects.filter(batch=batch, email=email).exists():
            return Response({"detail": "A participant with this email already exists in this batch."}, status=status.HTTP_400_BAD_REQUEST)

        participant = Participant.objects.create(
            batch=batch,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone_number=phone_number
        )
        serializer = ParticipantSerializer(participant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser])
    def upload_participants(self, request, pk=None):
        batch = self.get_object()
        file = request.FILES.get('file')

        if not file:
            return Response({"detail": "No file was uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data_set = file.read().decode('utf-8')
            io_string = io.StringIO(data_set)
            reader = csv.DictReader(io_string)

            required_cols = {'first_name', 'last_name', 'email'}
            if not reader.fieldnames or not required_cols.issubset(set(reader.fieldnames)):
                return Response(
                    {"detail": f"CSV must contain headers: {', '.join(required_cols)}. Found: {', '.join(reader.fieldnames) if reader.fieldnames else 'None'}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            success_count = 0
            skipped = []
            errors = []

            for row_idx, row in enumerate(reader, start=2):
                email = row.get('email', '').strip()
                first_name = row.get('first_name', '').strip()
                last_name = row.get('last_name', '').strip()
                phone_number = row.get('phone_number', '').strip() or None

                if not email or not first_name or not last_name:
                    errors.append({
                        "row": row_idx,
                        "email": email,
                        "error": "Missing required fields (email, first_name, last_name)."
                    })
                    continue

                if Participant.objects.filter(batch=batch, email=email).exists():
                    skipped.append({
                        "row": row_idx,
                        "email": email,
                        "reason": "Email already registered in this batch."
                    })
                    continue

                try:
                    Participant.objects.create(
                        batch=batch,
                        first_name=first_name,
                        last_name=last_name,
                        email=email,
                        phone_number=phone_number
                    )
                    success_count += 1
                except Exception as e:
                    errors.append({
                        "row": row_idx,
                        "email": email,
                        "error": str(e)
                    })

            return Response({
                "success_count": success_count,
                "skipped": skipped,
                "errors": errors
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Failed to parse CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all().order_by('last_name', 'first_name')
    serializer_class = ParticipantSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsPasswordChanged(), IsTraineeManager()]
        return [IsAuthenticated(), IsPasswordChanged()]

    def get_queryset(self):
        queryset = self.queryset
        
        search_query = self.request.query_params.get('search')
        if search_query:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(participant_id__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query)
            )
            
        batch_id = self.request.query_params.get('batch')
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        return queryset


class BatchStageViewSet(viewsets.ModelViewSet):
    queryset = BatchStage.objects.all().order_by('stage_type')
    serializer_class = BatchStageSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsPasswordChanged(), IsAssignedTrainerOrManager()]
        return [IsAuthenticated(), IsPasswordChanged()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return BatchStage.objects.none()

        # Filter queryset based on user role: trainers can only see stages of batches they are assigned to
        if user.role in [UserRole.TRAINER, UserRole.MASTER_TRAINER]:
            queryset = BatchStage.objects.filter(batch__trainers=user).order_by('stage_type')
        else:
            queryset = BatchStage.objects.all().order_by('stage_type')

        # Allow filtering by batch ID in query params
        batch_id = self.request.query_params.get('batch')
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        return queryset

    def perform_create(self, serializer):
        from django.core.exceptions import PermissionDenied
        batch = serializer.validated_data.get('batch')
        user = self.request.user
        if user.role in [UserRole.TRAINER, UserRole.MASTER_TRAINER]:
            if not batch.trainers.filter(id=user.id).exists():
                raise PermissionDenied("You are not assigned to this batch.")
        serializer.save()

