from rest_framework import serializers
from .models_ride_request import RideRequest

class RideRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideRequest
        fields = '__all__'
