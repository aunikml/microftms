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

    @action(detail=False, methods=['get'], url_path='divisional-overview')
    def divisional_overview(self, request):
        try:
            from regional_office.models import RegionalOffice
            from batches.models import Participant
            
            program = request.query_params.get('program', 'all')
            offices = RegionalOffice.objects.all().select_related('division').prefetch_related('regional_managers')
            participants = Participant.objects.all().select_related(
                'regional_office',
                'batch__cohort'
            ).prefetch_related('batch__stages')
            
            if program and program.lower() != 'all':
                participants = participants.filter(batch__program=program.lower())
            
            office_data = {}
            for office in offices:
                office_data[office.id] = {
                    "id": office.id,
                    "name": office.name,
                    "location": office.location,
                    "division_name": office.division.name if office.division else "No Division",
                    "latitude": float(office.latitude) if office.latitude else None,
                    "longitude": float(office.longitude) if office.longitude else None,
                    "regional_managers": [f"{m.first_name} {m.last_name}" for m in office.regional_managers.all()],
                    "cohorts": {}
                }
            
            stage_order = {'basic': 1, 'refresher_1': 2, 'refresher_2': 3}
            batch_stage_cache = {}
            
            def get_batch_active_stage(batch):
                if batch.id in batch_stage_cache:
                    return batch_stage_cache[batch.id]
                
                stages = [s for s in batch.stages.all() if s.status in ['scheduled', 'completed']]
                if not stages:
                    active_stage = 'basic'
                else:
                    latest = max(stages, key=lambda s: stage_order.get(s.stage_type, 0))
                    active_stage = latest.stage_type
                
                batch_stage_cache[batch.id] = active_stage
                return active_stage

            for p in participants:
                if not p.regional_office_id or p.regional_office_id not in office_data:
                    continue
                
                batch = p.batch
                cohort = batch.cohort
                cohort_code = cohort.cohort_code
                cohort_name = cohort.name
                
                office_entry = office_data[p.regional_office_id]
                
                if cohort_code not in office_entry["cohorts"]:
                    office_entry["cohorts"][cohort_code] = {
                        "cohort_code": cohort_code,
                        "cohort_name": cohort_name,
                        "total_trainees": 0,
                        "stages": {
                          "basic": 0,
                          "refresher_1": 0,
                          "refresher_2": 0
                        }
                    }
                
                active_stage = get_batch_active_stage(batch)
                
                cohort_entry = office_entry["cohorts"][cohort_code]
                cohort_entry["total_trainees"] += 1
                if active_stage in cohort_entry["stages"]:
                    cohort_entry["stages"][active_stage] += 1

            results = []
            for o_id, o_info in office_data.items():
                o_info["cohorts"] = list(o_info["cohorts"].values())
                results.append(o_info)
                
            return Response(results, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Failed to retrieve divisional overview data: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
