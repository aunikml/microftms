from rest_framework import serializers
from users.models import User
from users.serializers import UserSerializer
from regional_office.models import RegionalOffice, Division

class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'name', 'included_regions']

class RegionalOfficeSerializer(serializers.ModelSerializer):
    # Full manager details for GET requests
    regional_managers_details = UserSerializer(source='regional_managers', many=True, read_only=True)
    # List of IDs for writing (POST/PUT/PATCH)
    regional_managers = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='regional_manager'),
        many=True,
        required=False
    )
    # Division details and writing ForeignKey ID
    division_details = DivisionSerializer(source='division', read_only=True)
    division = serializers.PrimaryKeyRelatedField(
        queryset=Division.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = RegionalOffice
        fields = [
            'id',
            'name',
            'division',
            'division_details',
            'location',
            'regional_managers',
            'regional_managers_details'
        ]

    def validate_regional_managers(self, value):
        for user in value:
            if user.role != 'regional_manager':
                raise serializers.ValidationError(f"User {user.email} is not a Regional Manager.")
        return value

    def validate(self, attrs):
        # Retrieve the division and location, falling back to instance values if not in attrs
        division = attrs.get('division') if 'division' in attrs else (self.instance.division if self.instance else None)
        location = attrs.get('location') if 'location' in attrs else (self.instance.location if self.instance else None)
        
        if division and location:
            if location not in division.included_regions:
                raise serializers.ValidationError(
                    {"location": f"Location '{location}' is not included in the division '{division.name}'."}
                )
        return attrs
