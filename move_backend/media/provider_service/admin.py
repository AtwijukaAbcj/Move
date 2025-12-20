from django.contrib import admin
from .models import ProviderService

@admin.register(ProviderService)
class ProviderServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'service_provider', 'service_category', 'pricing_type', 'is_active')
    search_fields = ('title', 'short_description', 'full_description')
    list_filter = ('service_category', 'service_provider', 'pricing_type', 'is_active')
