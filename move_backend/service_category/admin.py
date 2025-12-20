from django.contrib import admin
from .models import ServiceCategory

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slung', 'display_order', 'is_active')
    prepopulated_fields = {"slung": ("name",)}
    search_fields = ('name', 'slung')
    list_filter = ('is_active',)
