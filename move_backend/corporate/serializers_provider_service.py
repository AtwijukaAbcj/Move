from rest_framework import serializers
from .models import ServiceCategory, ProviderService

class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = '__all__'

class ProviderServiceSerializer(serializers.ModelSerializer):
    service_category = ServiceCategorySerializer(read_only=True)
    service_category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(), source='service_category', write_only=True
    )

    class Meta:
        model = ProviderService
        fields = '__all__'
