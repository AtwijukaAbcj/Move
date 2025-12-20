from rest_framework import generics
from .models import ServiceProvider
from .serializers import ServiceProviderRegistrationSerializer

from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers


class ServiceProviderRegistrationAPIView(generics.CreateAPIView):
    queryset = ServiceProvider.objects.all()
    serializer_class = ServiceProviderRegistrationSerializer

    def perform_create(self, serializer):
        # Always set verification_status to 'pending' and is_active to False
        serializer.save(verification_status='pending', is_active=False)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data['message'] = 'Registration submitted. Awaiting approval.'
        return response
