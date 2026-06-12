from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from users.models import User, UserRole
from users.permissions import IsPasswordChanged
from batches.models import Batch, Participant
from batches.serializers import BatchSerializer

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsPasswordChanged]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        try:
            total_users = User.objects.count()
            total_trainers = User.objects.filter(role__in=[UserRole.TRAINER, UserRole.MASTER_TRAINER]).count()
            active_batches = Batch.objects.filter(status='active').count()
            total_participants = Participant.objects.count()

            
            # Serialize batches according to role access
            if request.user.role in [UserRole.TRAINER, UserRole.MASTER_TRAINER]:
                batches = Batch.objects.filter(trainers=request.user).order_by('-start_date')
            else:
                batches = Batch.objects.all().order_by('-start_date')
            batch_serializer = BatchSerializer(batches, many=True)

            
            payload = {
                "metrics": {
                    "total_users": total_users,
                    "total_trainers": total_trainers,
                    "active_batches": active_batches,
                    "total_participants": total_participants
                },
                "batches": batch_serializer.data
            }
            return Response(payload, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Failed to retrieve overview data: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='regional-manager')
    def regional_manager(self, request):
        try:
            user = request.user
            if user.role == UserRole.REGIONAL_MANAGER:
                offices = user.regional_offices.all()
                participants = Participant.objects.filter(regional_office__in=offices)
            elif user.role in [UserRole.SUPER_ADMIN, UserRole.PROGRAM_SUPERVISOR]:
                participants = Participant.objects.all()
            else:
                return Response({"detail": "Permission denied. Only Regional Managers can view this dashboard."}, status=status.HTTP_403_FORBIDDEN)

            from batches.models import Attendance
            attendance_records = Attendance.objects.filter(participant__in=participants).select_related('stage')

            att_map = {}
            for att in attendance_records:
                p_id = att.participant_id
                stage_type = att.stage.stage_type if (att.stage and att.stage.stage_type) else 'basic'
                
                if p_id not in att_map:
                    att_map[p_id] = {}
                if stage_type not in att_map[p_id]:
                    att_map[p_id][stage_type] = {'present': 0, 'total': 0}
                    
                att_map[p_id][stage_type]['total'] += 1
                if att.status in ['present', 'late']:
                    att_map[p_id][stage_type]['present'] += 1

            results = []
            for p in participants.select_related('regional_office', 'batch__cohort').order_by('last_name', 'first_name'):
                p_map = att_map.get(p.id, {})
                
                def get_rate_str(stage_type):
                    stats = p_map.get(stage_type)
                    if not stats or stats['total'] == 0:
                        return "N/A"
                    rate = round((stats['present'] / stats['total']) * 100)
                    return f"{rate}% ({stats['present']}/{stats['total']})"
                    
                results.append({
                    "id": p.id,
                    "participant_id": p.participant_id,
                    "name": f"{p.first_name} {p.last_name}",
                    "email": p.email,
                    "phone": p.phone_number or "-",
                    "batch_name": p.batch.batch_name,
                    "regional_office": p.regional_office.name if p.regional_office else "-",
                    "cohort_id": p.batch.cohort.id if (p.batch and p.batch.cohort) else None,
                    "cohort_code": p.batch.cohort.cohort_code if (p.batch and p.batch.cohort) else "-",
                    "cohort_name": p.batch.cohort.name if (p.batch and p.batch.cohort) else "-",
                    "basic_attendance": get_rate_str('basic'),
                    "refresher_1_attendance": get_rate_str('refresher_1'),
                    "refresher_2_attendance": get_rate_str('refresher_2')
                })

            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Failed to retrieve dashboard data: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
