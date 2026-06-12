from django.contrib import admin
from regional_office.models import RegionalOffice

@admin.register(RegionalOffice)
class RegionalOfficeAdmin(admin.ModelAdmin):
    list_display = ('name', 'division', 'location')
    search_fields = ('name', 'division')
    filter_horizontal = ('regional_managers',)
