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
