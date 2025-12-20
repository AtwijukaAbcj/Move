from django.db import models
from service_category.models import ServiceCategory

class ServiceProvider(models.Model):
    PROVIDER_TYPE_CHOICES = [
        ('individual', 'Individual'),
        ('company', 'Company'),
    ]
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    PAYOUT_METHOD_CHOICES = [
        ('bank', 'Bank'),
        ('mobile_money', 'Mobile Money'),
    ]
    AVAILABILITY_STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('scheduled', 'Scheduled'),
    ]
    
    # Identity
    provider_type = models.CharField(max_length=20, choices=PROVIDER_TYPE_CHOICES)
    name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Contact
    phone = models.CharField(max_length=32)
    email = models.EmailField()
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    
    # Profile
    profile_photo = models.ImageField(upload_to='provider_photos/', blank=True, null=True)
    logo = models.ImageField(upload_to='provider_logos/', blank=True, null=True)
    rating = models.FloatField(default=0)
    total_jobs = models.PositiveIntegerField(default=0)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    
    # Capabilities
    service_categories = models.ManyToManyField(ServiceCategory, related_name='providers')
    operating_cities = models.CharField(max_length=255, blank=True)  # Comma-separated
    languages = models.CharField(max_length=255, blank=True)  # Comma-separated
    
    # Compliance
    id_document = models.FileField(upload_to='provider_id_docs/', blank=True, null=True)
    license_document = models.FileField(upload_to='provider_license_docs/', blank=True, null=True)
    insurance_document = models.FileField(upload_to='provider_insurance_docs/', blank=True, null=True)
    background_check_status = models.CharField(max_length=32, blank=True)
    
    # Payments
    payout_method = models.CharField(max_length=20, choices=PAYOUT_METHOD_CHOICES, blank=True)
    payout_details = models.TextField(blank=True)
    commission_percentage = models.FloatField(default=0)
    
    # Operations
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_STATUS_CHOICES, default='offline')
    response_time_avg = models.FloatField(default=0)
    cancellation_rate = models.FloatField(default=0)
    
    # Meta
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name or self.name
