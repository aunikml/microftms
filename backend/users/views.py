import csv
import io
from rest_framework import status, viewsets, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView

from users.models import User, UserRole
from users.serializers import (
    UserSerializer,
    UserCreateSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer
)
from users.permissions import IsSuperAdmin, IsPasswordChanged

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.is_password_changed = True
            user.save()
            return Response(
                {"detail": "Password has been changed successfully. You can now use the application."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        if role:
            roles = role.split(',')
            queryset = queryset.filter(role__in=roles)
        return queryset

    def get_permissions(self):
        # Admin CRUD endpoints and bulk import require SuperAdmin
        if self.action in ['create', 'destroy', 'update', 'partial_update', 'bulk_import']:
            # We enforce that they changed password AND they are Super Admin
            return [IsAuthenticated(), IsPasswordChanged(), IsSuperAdmin()]
        
        # List/retrieve requires authentication and password changed
        return [IsAuthenticated(), IsPasswordChanged()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        # Overriding to return full details upon creation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        headers = self.get_success_headers(serializer.data)
        
        # Return full UserSerializer details instead of CreateSerializer details
        full_serializer = UserSerializer(user)
        return Response(full_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def bulk_import(self, request):
        file = request.FILES.get('file')
        role = request.data.get('role')
        
        if not file:
            return Response({"detail": "No file was uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        if not role:
            return Response({"detail": "No role was selected."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Validate that the role is valid
        if role not in UserRole.values:
            return Response({"detail": "Invalid role selected."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Read and parse CSV
            data_set = file.read().decode('utf-8')
            io_string = io.StringIO(data_set)
            reader = csv.DictReader(io_string)
            
            # Check for required columns
            required_cols = {'first_name', 'last_name', 'email'}
            if not reader.fieldnames or not required_cols.issubset(set(reader.fieldnames)):
                return Response(
                    {"detail": f"CSV must contain headers: {', '.join(required_cols)}. Found: {', '.join(reader.fieldnames) if reader.fieldnames else 'None'}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            success_count = 0
            skipped = []
            errors = []
            
            for row_idx, row in enumerate(reader, start=2): # Header is row 1
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
                    
                if User.objects.filter(email=email).exists():
                    skipped.append({
                        "row": row_idx,
                        "email": email,
                        "reason": "Email already exists in system."
                    })
                    continue
                    
                # Create user
                try:
                    serializer = UserCreateSerializer(data={
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "phone_number": phone_number,
                        "role": role
                    })
                    if serializer.is_valid():
                        serializer.save()
                        success_count += 1
                    else:
                        # Extract error details
                        err_msg = "; ".join([f"{k}: {', '.join(v)}" for k, v in serializer.errors.items()])
                        errors.append({
                            "row": row_idx,
                            "email": email,
                            "error": err_msg
                        })
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
