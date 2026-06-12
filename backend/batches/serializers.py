from rest_framework import serializers
from batches.models import Cohort, Batch, Participant, Attendance, BatchStage
from users.serializers import UserSerializer
from regional_office.models import Division, RegionalOffice
from regional_office.serializers import DivisionSerializer, RegionalOfficeSerializer

class CohortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cohort
        fields = ['id', 'cohort_code', 'name', 'description']


class BatchStageSerializer(serializers.ModelSerializer):
    stage_type_display = serializers.CharField(source='get_stage_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    format_display = serializers.CharField(source='get_format_display', read_only=True)

    class Meta:
        model = BatchStage
        fields = [
            'id', 'batch', 'stage_type', 'stage_type_display', 
            'format', 'format_display', 'start_date', 'end_date', 
            'status', 'status_display'
        ]
        read_only_fields = ['id', 'stage_type_display', 'status_display', 'format_display']

    def validate(self, attrs):
        # 1. Resolve values, incorporating existing instance values for updates
        batch = attrs.get('batch') or (self.instance.batch if self.instance else None)
        stage_type = attrs.get('stage_type') or (self.instance.stage_type if self.instance else None)
        status = attrs.get('status') or (self.instance.status if self.instance else None)
        start_date = attrs.get('start_date') or (self.instance.start_date if self.instance else None)
        end_date = attrs.get('end_date') or (self.instance.end_date if self.instance else None)

        # 2. Immutable checks on update
        if self.instance:
            if 'batch' in attrs and attrs['batch'] != self.instance.batch:
                raise serializers.ValidationError({"batch": "Cannot change the batch of an existing stage."})
            if 'stage_type' in attrs and attrs['stage_type'] != self.instance.stage_type:
                raise serializers.ValidationError({"stage_type": "Cannot change the stage type of an existing stage."})

        # 3. Date ordering check
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})

        # 4. Required fields check for scheduled stages
        if status == BatchStage.StatusChoices.SCHEDULED and stage_type in [BatchStage.StageType.REFRESHER_1, BatchStage.StageType.REFRESHER_2]:
            format_val = attrs.get('format') or (self.instance.format if self.instance else None)
            if not start_date or not end_date or not format_val:
                raise serializers.ValidationError({
                    "non_field_errors": "Start date, end date, and format are required when scheduling refresher stages."
                })

        return attrs


class BatchSerializer(serializers.ModelSerializer):
    cohort_details = CohortSerializer(source='cohort', read_only=True)
    division_details = DivisionSerializer(source='division', read_only=True)
    division = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(),
        required=False,
        allow_null=True
    )
    participant_count = serializers.IntegerField(source='participants.count', read_only=True)
    trainers_details = UserSerializer(source='trainers', many=True, read_only=True)
    stages = BatchStageSerializer(many=True, read_only=True)

    class Meta:
        model = Batch
        fields = [
            'id', 
            'batch_name', 
            'program', 
            'division', 
            'division_details', 
            'location', 
            'start_date', 
            'cohort', 
            'cohort_details', 
            'participant_count', 
            'trainers', 
            'trainers_details', 
            'latitude', 
            'longitude', 
            'status',
            'stages'
        ]
        extra_kwargs = {
            'trainers': {'write_only': True, 'required': False},
            'batch_name': {'required': False, 'allow_blank': True}
        }



class ParticipantSerializer(serializers.ModelSerializer):
    regional_office_details = RegionalOfficeSerializer(source='regional_office', read_only=True)
    regional_office = serializers.PrimaryKeyRelatedField(
        queryset=RegionalOffice.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Participant
        fields = [
            'id', 'participant_id', 'batch', 'first_name', 'last_name', 
            'email', 'phone_number', 'regional_office', 'regional_office_details'
        ]
        read_only_fields = ['id', 'participant_id']


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'batch', 'stage', 'participant', 'date', 'status', 'marked_by']
        read_only_fields = ['id', 'marked_by']

