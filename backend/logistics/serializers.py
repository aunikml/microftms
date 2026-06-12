from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from users.models import UserRole
from logistics.models import LogisticsItem, Accommodation, Transport, LogisticsRequest, LogisticsRequestItem

class LogisticsItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogisticsItem
        fields = ['id', 'name', 'category', 'quantity', 'unit_cost', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class AccommodationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Accommodation
        fields = [
            'id', 'name', 'location', 'type', 'room_type', 'room_unit_cost',
            'classroom_type', 'classroom_unit_cost',
            'has_wifi', 'has_projector', 'has_whiteboard', 'has_dining',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class TransportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transport
        fields = ['id', 'name', 'type', 'capacity', 'unit_cost', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LogisticsRequestItemSerializer(serializers.ModelSerializer):
    item_details = LogisticsItemSerializer(source='item', read_only=True)
    
    class Meta:
        model = LogisticsRequestItem
        fields = ['id', 'item', 'item_details', 'quantity']


class LogisticsRequestSerializer(serializers.ModelSerializer):
    requested_items = LogisticsRequestItemSerializer(many=True, read_only=True)
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    batch_name = serializers.CharField(source='batch.batch_name', read_only=True)
    batch_location = serializers.CharField(source='batch.location', read_only=True)
    accommodation_details = AccommodationSerializer(source='accommodation', read_only=True)
    # Write support for nested items
    items_input = serializers.JSONField(write_only=True, required=False)
    
    class Meta:
        model = LogisticsRequest
        fields = [
            'id', 'batch', 'batch_name', 'batch_location', 'created_by', 'created_by_email', 'created_by_name',
            'accommodation', 'accommodation_details', 'check_in_date', 'check_out_date', 'num_trainers', 
            'requested_items', 'items_input', 'is_opened',
            'stationary_status', 'it_status', 'accommodation_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_email', 'created_by_name', 'batch_name', 'batch_location', 'accommodation_details', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else 'Trainer'

    def validate_items_input(self, value):
        if value is not None:
            if not isinstance(value, list):
                raise serializers.ValidationError("items_input must be a list of items.")
            for item_data in value:
                if not isinstance(item_data, dict):
                    raise serializers.ValidationError("Each item in items_input must be a dictionary.")
                if 'item_id' not in item_data or 'quantity' not in item_data:
                    raise serializers.ValidationError("Each item must contain 'item_id' and 'quantity'.")
                try:
                    qty = int(item_data['quantity'])
                    if qty <= 0:
                        raise ValueError
                except (ValueError, TypeError):
                    raise serializers.ValidationError("Quantity must be a positive integer.")
                
                if not LogisticsItem.objects.filter(id=item_data['item_id']).exists():
                    raise serializers.ValidationError(f"LogisticsItem with id {item_data['item_id']} does not exist.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            batch = attrs.get('batch')
            if batch and user.role in [UserRole.TRAINER, UserRole.MASTER_TRAINER]:
                if not batch.trainers.filter(id=user.id).exists():
                    raise PermissionDenied("You are not assigned as an instructor to this batch.")
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items_input', [])
        request = LogisticsRequest.objects.create(**validated_data)
        for it in items_data:
            LogisticsRequestItem.objects.create(
                request=request,
                item_id=it['item_id'],
                quantity=it['quantity']
            )
        return request

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items_input', None)
        
        # Update accommodation & other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update items if provided
        if items_data is not None:
            instance.requested_items.all().delete()
            for it in items_data:
                LogisticsRequestItem.objects.create(
                    request=instance,
                    item_id=it['item_id'],
                    quantity=it['quantity']
                )
        return instance

