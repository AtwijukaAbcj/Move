from django.contrib import admin

from .models import Advert, Driver, Customer
@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'phone', 'is_active', 'date_joined')
    list_filter = ('is_active', 'date_joined')
    search_fields = ('full_name', 'email', 'phone')


@admin.register(Advert)
class AdvertAdmin(admin.ModelAdmin):
    list_display = ('caption', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('caption',)

@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email', 'vehicle_type', 'is_active', 'otp_verified')
    list_filter = ('is_active', 'otp_verified', 'vehicle_type')
    search_fields = ('full_name', 'phone', 'email')
