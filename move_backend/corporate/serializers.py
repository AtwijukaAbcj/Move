

from rest_framework import serializers
# Google Registration/Login Serializer
class CustomerGoogleAuthSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField()
    google_id = serializers.CharField()
from .models import Customer, Driver
class DriverDashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['id', 'full_name', 'is_approved', 'is_online']

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
