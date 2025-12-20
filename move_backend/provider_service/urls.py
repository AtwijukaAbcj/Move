from django.urls import path
from .views import provider_services_by_category, provider_service_detail

urlpatterns = [
    path('', provider_services_by_category, name='provider_services_by_category'),
    path('<int:pk>/', provider_service_detail, name='provider_service_detail'),
]
