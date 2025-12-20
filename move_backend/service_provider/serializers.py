from rest_framework import serializers
from .models import ServiceProvider

class ServiceProviderRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceProvider
        fields = [
            'provider_type',
            'name',
            'display_name',
            'phone',
            'email',
            'address',
            'city',
            'country',
            'service_categories',
        ]
