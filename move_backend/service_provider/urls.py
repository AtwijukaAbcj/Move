from django.urls import path
from .views import ServiceProviderRegistrationAPIView

urlpatterns = [
    path('register/', ServiceProviderRegistrationAPIView.as_view(), name='service-provider-register'),
]
