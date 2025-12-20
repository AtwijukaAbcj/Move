from django.contrib import admin
from .models import Advert

@admin.register(Advert)
class AdvertAdmin(admin.ModelAdmin):
    list_display = ('caption', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('caption',)
