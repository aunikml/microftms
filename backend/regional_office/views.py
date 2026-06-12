from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from users.permissions import IsSuperAdmin, IsPasswordChanged
from regional_office.models import RegionalOffice, Division
from regional_office.serializers import RegionalOfficeSerializer, DivisionSerializer

class DivisionViewSet(viewsets.ModelViewSet):
    queryset = Division.objects.all().order_by('name')
    serializer_class = DivisionSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsPasswordChanged(), IsSuperAdmin()]
        return [permissions.IsAuthenticated(), IsPasswordChanged()]

    @action(detail=False, methods=['get'], url_path='locations')
    def get_locations(self, request):
        from regional_office.locations_data import LOCATIONS
        return Response(LOCATIONS)

class RegionalOfficeViewSet(viewsets.ModelViewSet):
    serializer_class = RegionalOfficeSerializer

    def get_queryset(self):
        queryset = RegionalOffice.objects.all().order_by('name')
        
        # Filtering by division (either division name or ID)
        division = self.request.query_params.get('division')
        if division:
            if division.isdigit():
                queryset = queryset.filter(division_id=division)
            else:
                queryset = queryset.filter(division__name__iexact=division)
            
        # Filtering by RO name (case-insensitive contains)
        name = self.request.query_params.get('name')
        if name:
            queryset = queryset.filter(name__icontains=name)
            
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsPasswordChanged(), IsSuperAdmin()]
        return [permissions.IsAuthenticated(), IsPasswordChanged()]
