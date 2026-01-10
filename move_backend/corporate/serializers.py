

from rest_framework import serializers
# Google Registration/Login Serializer
class CustomerGoogleAuthSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(required=False)  # Accept "name" from Google
    full_name = serializers.CharField(required=False)  # Also accept "full_name"
    google_id = serializers.CharField()
    picture = serializers.URLField(required=False)
from .models import Customer, Driver
class DriverDashboardSerializer(serializers.ModelSerializer):
    has_documents = serializers.SerializerMethodField()
    
    class Meta:
        model = Driver
        fields = ['id', 'full_name', 'phone', 'email', 'vehicle_type', 'vehicle_number', 'is_approved', 'is_online', 'is_active', 'otp_verified', 'has_documents']
    
    def get_has_documents(self, obj):
        # Check if driver has uploaded required documents
        return bool(obj.drivers_license and obj.car_ownership)

class CustomerRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'email', 'full_name', 'phone', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        customer = Customer(**validated_data)
        customer.set_password(password)
        customer.save()
        return customer

class CustomerLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


from rest_framework import serializers
from .models import Driver, Advert

class DriverRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['id', 'phone', 'email', 'full_name', 'vehicle_type', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        # Phone is always required
        if not data.get('phone'):
            raise serializers.ValidationError({"phone": "Phone number is required"})
        # Email is required only if otp_method is email
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        driver = Driver(**validated_data)
        driver.set_password(password)
        driver.save()
        return driver

class DriverLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True)


class OtpSerializer(serializers.Serializer):
    phone = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    otp_code = serializers.CharField()

class AdvertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Advert
        fields = ['id', 'image', 'caption', 'is_active', 'created_at']

from .models import Booking, ServiceBooking, Driver

class DriverBasicSerializer(serializers.ModelSerializer):
    """Basic driver info for embedding in booking responses"""
    vehicle_number = serializers.SerializerMethodField()
    
    class Meta:
        model = Driver
        fields = ['id', 'full_name', 'phone', 'vehicle_type', 'vehicle_number', 'rating', 'total_trips']
    
    def get_vehicle_number(self, obj):
        return obj.vehicle_number or 'MOV-0000'


class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    driver_name = serializers.CharField(source='driver.full_name', read_only=True)
    driver = DriverBasicSerializer(read_only=True)
    driver_id = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(), source='driver', write_only=True, required=False
    )
    
    class Meta:
        model = Booking
        fields = [
            'id', 'customer', 'customer_name', 'driver', 'driver_id', 'driver_name',
            'pickup_location', 'destination', 'ride_type',
            'pickup_latitude', 'pickup_longitude',
            'destination_latitude', 'destination_longitude',
            'contact_name', 'contact_phone',
            'fare', 'distance', 'duration',
            'payment_method', 'payment_completed', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'customer_name', 'driver_name', 'driver']


class ServiceBookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    service_title = serializers.CharField(source='provider_service.title', read_only=True)
    
    class Meta:
        model = ServiceBooking
        fields = [
            'id', 'provider_service', 'service_title', 'customer', 'customer_name',
            'phone', 'number_of_cars', 'total_passengers', 'total_price',
            'date', 'time', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'customer_name', 'service_title']


from .models import ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'booking', 'sender_type', 'sender_customer', 'sender_driver',
            'sender_name', 'message', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'sender_name']
    
    def get_sender_name(self, obj):
        if obj.sender_type == 'customer' and obj.sender_customer:
            return obj.sender_customer.full_name
        elif obj.sender_type == 'driver' and obj.sender_driver:
            return obj.sender_driver.full_name
        return 'Unknown'
