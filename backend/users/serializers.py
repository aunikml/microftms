from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from users.models import User, UserRole
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['is_password_changed'] = user.is_password_changed
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user info in response body
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'phone_number': self.user.phone_number,
            'role': self.user.role,
            'is_password_changed': self.user.is_password_changed,
            'full_name': self.user.full_name,
        }
        return data

class UserSerializer(serializers.ModelSerializer):
    is_google_linked = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 
            'phone_number', 'role', 'is_password_changed', 
            'date_joined', 'full_name', 'is_google_linked'
        ]
        read_only_fields = ['id', 'is_password_changed', 'date_joined', 'is_google_linked']

    def get_is_google_linked(self, obj):
        return hasattr(obj, 'google_token')

class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'role']

    def create(self, validated_data):
        email = validated_data['email']
        # Set default password as the email itself
        # is_password_changed will automatically be False
        user = User.objects.create_user(
            email=email,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number'),
            role=validated_data.get('role', UserRole.TRAINER),
            password=None # This triggers create_user setting password to email
        )
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        if not user.check_password(attrs['old_password']):
            raise serializers.ValidationError({"old_password": "Old password is incorrect."})
        if attrs['old_password'] == attrs['new_password']:
            raise serializers.ValidationError({"new_password": "New password must be different from the old password."})
        return attrs
