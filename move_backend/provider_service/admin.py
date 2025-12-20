from django.contrib import admin
from .models import ProviderService

@admin.register(ProviderService)
class ProviderServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'service_provider', 'service_category', 'is_active', 'created_at')
    search_fields = ('title', 'service_provider__name', 'service_category__name')
    list_filter = ('is_active', 'service_category', 'service_provider')
    ordering = ('-created_at',)
