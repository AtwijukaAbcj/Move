from django.contrib import admin
from .models import ServiceProvider

@admin.register(ServiceProvider)
class ServiceProviderAdmin(admin.ModelAdmin):
    list_display = ('id', 'display_name', 'provider_type', 'city', 'country', 'verification_status', 'is_active')
    search_fields = ('name', 'display_name', 'email', 'phone')
    list_filter = ('provider_type', 'verification_status', 'is_active', 'city', 'country')
    filter_horizontal = ('service_categories',)
