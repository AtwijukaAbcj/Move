from django.db import models
from service_category.models import ServiceCategory
from service_provider.models import ServiceProvider

class ProviderService(models.Model):
    PRICING_TYPE_CHOICES = [
        ('flat', 'Flat'),
        ('per_km', 'Per KM'),
        ('per_hour', 'Per Hour'),
        ('package', 'Package'),
    ]
    BOOKING_MODE_CHOICES = [
        ('instant', 'Instant'),
        ('scheduled', 'Scheduled'),
    ]

    # Identity & Linking
    service_category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='provider_services')
    service_provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='provider_services')

    # Display / Listing
    title = models.CharField(max_length=255)
    short_description = models.CharField(max_length=255, blank=True)
    full_description = models.TextField(blank=True)
    photos = models.JSONField(blank=True, null=True)  # List of image URLs or paths
    image1 = models.ImageField(upload_to='service_provided/', blank=True, null=True)
    image2 = models.ImageField(upload_to='service_provided/', blank=True, null=True)
    image3 = models.ImageField(upload_to='service_provided/', blank=True, null=True)
    image4 = models.ImageField(upload_to='service_provided/', blank=True, null=True)
    image5 = models.ImageField(upload_to='service_provided/', blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    # Pricing
    pricing_type = models.CharField(max_length=20, choices=PRICING_TYPE_CHOICES)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_per_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    minimum_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='USD')

    # Booking Rules
    booking_mode = models.CharField(max_length=20, choices=BOOKING_MODE_CHOICES, default='scheduled')
    min_advance_booking_minutes = models.PositiveIntegerField(default=0)
    cancellation_window_minutes = models.PositiveIntegerField(default=0)
    cancellation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Capacity
    max_passengers = models.PositiveIntegerField(default=1)
    max_luggage = models.PositiveIntegerField(default=0)

    # Vehicle / Asset
    vehicle_id = models.CharField(max_length=100, blank=True, null=True)
    vehicle_type = models.CharField(max_length=100, blank=True)
    vehicle_features = models.CharField(max_length=255, blank=True)
    inspection_required = models.BooleanField(default=False)

    # Availability
    available_cities = models.CharField(max_length=255, blank=True)  # Comma-separated
    available_days = models.CharField(max_length=100, blank=True)  # e.g. Mon,Tue,Wed
    available_start_time = models.TimeField(blank=True, null=True)
    available_end_time = models.TimeField(blank=True, null=True)

    # Quality & Filters
    minimum_provider_rating = models.FloatField(default=0)
    priority_score = models.FloatField(default=0)

    # Custom Requirements
    required_fields = models.JSONField(blank=True, null=True)  # e.g. {"flight_number": true}
    add_ons = models.JSONField(blank=True, null=True)  # e.g. {"decoration": true}

    # Status & Metrics
    total_bookings = models.PositiveIntegerField(default=0)
    average_rating = models.FloatField(default=0)

    # Meta
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
