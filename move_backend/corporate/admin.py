from django.contrib import admin

from .models import Advert, Driver, Customer, User, Booking

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


# Register User model for backend/admin users
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'email')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'driver', 'ride_type', 'fare', 'status', 'created_at')
    list_filter = ('status', 'ride_type', 'payment_method', 'payment_completed', 'created_at')
    search_fields = ('customer__full_name', 'driver__full_name', 'pickup_location', 'destination')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
