from django.db import models
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
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
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
    is_active = models.BooleanField(default=True)
    is_online = models.BooleanField(default=False, help_text='Driver online/offline status')
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_method = models.CharField(max_length=10, blank=True, null=True)  # 'phone' or 'email'
    otp_verified = models.BooleanField(default=False)
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
        ('confirmed', 'Confirmed'),
        ('driver_assigned', 'Driver Assigned'),
        ('picked_up', 'Picked Up'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, related_name='bookings', null=True, blank=True)
    
    pickup_location = models.CharField(max_length=500)
    destination = models.CharField(max_length=500)
    ride_type = models.CharField(max_length=20, choices=RIDE_TYPE_CHOICES)
    
    fare = models.DecimalField(max_digits=10, decimal_places=2)
    distance = models.DecimalField(max_digits=10, decimal_places=2, help_text='Distance in kilometers')
    duration = models.IntegerField(help_text='Duration in minutes')
    
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_completed = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Booking #{self.id} - {self.customer} - {self.status}"
