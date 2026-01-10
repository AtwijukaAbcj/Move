from django.db import models
from provider_service.models import ProviderService as ActualProviderService

class ServiceCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='service_category_images/', blank=True, null=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class ProviderService(models.Model):
    service_category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='provider_services')
    title = models.CharField(max_length=255)
    short_description = models.CharField(max_length=255, blank=True)
    full_description = models.TextField(blank=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='USD')
    # Add other fields as needed

    def __str__(self):
        return self.title

# Customer model for app users
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class CustomerManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Customers must have an email')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class Customer(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='customer_profiles/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    expo_push_token = models.CharField(max_length=255, blank=True, null=True, help_text='Expo push notification token')
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customer_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customer_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomerManager()

    def __str__(self):
        return self.full_name or self.email

class DriverManager(BaseUserManager):
    def create_user(self, phone, email, password=None, **extra_fields):
        if not phone and not email:
            raise ValueError('Drivers must have a phone or email')
        email = self.normalize_email(email)
        user = self.model(phone=phone, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone, email, password, **extra_fields)



class Driver(AbstractBaseUser, PermissionsMixin):
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    full_name = models.CharField(max_length=255)
    vehicle_type = models.CharField(max_length=50, blank=True, null=True)
    vehicle_number = models.CharField(max_length=20, blank=True, null=True, help_text='Vehicle license plate number')
    is_active = models.BooleanField(default=True)
    is_online = models.BooleanField(default=False, help_text='Driver online/offline status')
    
    # Location tracking for driver matching
    current_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    location_updated_at = models.DateTimeField(null=True, blank=True)
    
    # Driver performance metrics
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00, help_text='Average driver rating (1-5)')
    total_ratings = models.PositiveIntegerField(default=0, help_text='Total number of ratings received')
    total_trips = models.PositiveIntegerField(default=0, help_text='Total completed trips')
    
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_method = models.CharField(max_length=10, blank=True, null=True)  # 'phone' or 'email'
    otp_verified = models.BooleanField(default=False)
    expo_push_token = models.CharField(max_length=255, blank=True, null=True, help_text='Expo push notification token')
    drivers_license = models.FileField(upload_to='verification_docs/drivers_license/', blank=True, null=True)
    car_ownership = models.FileField(upload_to='verification_docs/car_ownership/', blank=True, null=True)
    car_image_1 = models.ImageField(upload_to='verification_docs/car_images/', blank=True, null=True)
    car_image_2 = models.ImageField(upload_to='verification_docs/car_images/', blank=True, null=True)
    inspection_report = models.FileField(upload_to='verification_docs/inspection_report/', blank=True, null=True)
    is_approved = models.BooleanField(default=False, help_text='Admin approval status')
    approval_notes = models.TextField(blank=True, null=True, help_text='Admin notes for approval/rejection')
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='driver_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='driver_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['email']

    objects = DriverManager()

    def __str__(self):
        return self.full_name or self.phone or self.email
    
    def has_uploaded_documents(self):
        """Check if driver has uploaded all required documents"""
        return all([
            self.drivers_license,
            self.car_ownership,
            self.car_image_1,
            self.car_image_2,
            self.inspection_report
        ])
    
    def can_receive_requests(self):
        """Check if driver is eligible to receive ride requests"""
        return self.has_uploaded_documents() and self.is_approved and self.otp_verified
    
from django.db import models

class Advert(models.Model):
    image = models.ImageField(upload_to='adverts/', blank=True, null=True)
    caption = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.caption

# Admin User model for backend management
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('Users must have a username')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='adminuser_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='adminuser_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    def __str__(self):
        return self.username

class Booking(models.Model):
    RIDE_TYPE_CHOICES = [
        ('standard', 'MOVE Standard'),
        ('xl', 'MOVE XL'),
        ('premium', 'MOVE Premium'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('card', 'Credit/Debit Card'),
        ('mobilemoney', 'Mobile Money'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('searching_driver', 'Searching Driver'),
        ('driver_assigned', 'Driver Assigned'),
        ('driver_arrived', 'Driver Arrived'),
        ('picked_up', 'Picked Up'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, related_name='bookings', null=True, blank=True)
    
    pickup_location = models.CharField(max_length=500)
    destination = models.CharField(max_length=500)
    ride_type = models.CharField(max_length=20, choices=RIDE_TYPE_CHOICES)
    
    # Optional contact information for this specific ride
    contact_name = models.CharField(max_length=255, blank=True, null=True, help_text='Optional contact name for this ride')
    contact_phone = models.CharField(max_length=20, blank=True, null=True, help_text='Optional contact phone for this ride')
    
    # Location coordinates for driver matching
    pickup_latitude = models.DecimalField(max_digits=12, decimal_places=8, null=True, blank=True)
    pickup_longitude = models.DecimalField(max_digits=12, decimal_places=8, null=True, blank=True)
    destination_latitude = models.DecimalField(max_digits=12, decimal_places=8, null=True, blank=True)
    destination_longitude = models.DecimalField(max_digits=12, decimal_places=8, null=True, blank=True)
    
    fare = models.DecimalField(max_digits=10, decimal_places=2)
    distance = models.DecimalField(max_digits=10, decimal_places=2, help_text='Distance in kilometers')
    duration = models.IntegerField(help_text='Duration in minutes')
    
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_completed = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Receipt tracking
    receipt_sent = models.BooleanField(default=False)
    receipt_sent_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Booking #{self.id} - {self.customer} - {self.status}"


class ServiceBooking(models.Model):
    """Booking for provider services (Airport drop offs, etc.)"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    provider_service = models.ForeignKey(ActualProviderService, on_delete=models.CASCADE, related_name='service_bookings')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='service_bookings')
    
    # Optional contact phone for this specific booking
    phone = models.CharField(max_length=20, blank=True, null=True, help_text='Optional contact phone for this booking')
    
    # Number of cars and passengers
    number_of_cars = models.IntegerField(default=1, help_text='Number of cars required')
    total_passengers = models.IntegerField(default=4, help_text='Total number of passengers (4 per car)')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, help_text='Total price for all cars')
    
    date = models.DateField()
    time = models.TimeField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Service Booking #{self.id} - {self.customer} - {self.provider_service.title}"


class ChatMessage(models.Model):
    """Real-time chat messages between drivers and customers"""
    SENDER_TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('driver', 'Driver'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='chat_messages')
    sender_type = models.CharField(max_length=10, choices=SENDER_TYPE_CHOICES)
    sender_customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_messages')
    sender_driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_messages')
    
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message from {self.sender_type} in Booking #{self.booking_id} at {self.created_at}"


class RideOffer(models.Model):
    """
    Tracks individual ride offers sent to drivers.
    Implements sequential offer dispatch - one driver at a time with timeout.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),      # Offer sent, waiting for response
        ('accepted', 'Accepted'),    # Driver accepted
        ('declined', 'Declined'),    # Driver explicitly declined
        ('expired', 'Expired'),      # Timeout - no response
        ('cancelled', 'Cancelled'),  # Booking was cancelled
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='ride_offers')
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='ride_offers')
    
    # Scoring info (for analytics/debugging)
    distance_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, 
                                       help_text='Distance from driver to pickup in km')
    driver_score = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True,
                                        help_text='Calculated score for this driver')
    offer_order = models.IntegerField(default=1, help_text='Order in which this offer was sent (1=first)')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    offered_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text='When this offer expires')
    responded_at = models.DateTimeField(null=True, blank=True, help_text='When driver responded')
    
    class Meta:
        ordering = ['-offered_at']
        # Ensure only one pending offer per booking at a time
        constraints = [
            models.UniqueConstraint(
                fields=['booking'],
                condition=models.Q(status='pending'),
                name='unique_pending_offer_per_booking'
            )
        ]
    
    def __str__(self):
        return f"Offer for Booking #{self.booking_id} to Driver #{self.driver_id} - {self.status}"
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at and self.status == 'pending'
    
    @property
    def seconds_remaining(self):
        from django.utils import timezone
        if self.status != 'pending':
            return 0
        remaining = (self.expires_at - timezone.now()).total_seconds()
        return max(0, int(remaining))


class DriverNotification(models.Model):
    """
    Notifications for drivers (cancellations, updates, etc.)
    """
    NOTIFICATION_TYPES = (
        ('ride_cancelled', 'Ride Cancelled'),
        ('ride_updated', 'Ride Updated'),
        ('payment_received', 'Payment Received'),
        ('account_update', 'Account Update'),
        ('system', 'System Notification'),
    )
    
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='notifications')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, 
                                related_name='driver_notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type}: {self.title} - Driver #{self.driver_id}"
