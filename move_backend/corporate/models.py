
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

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
