from django.urls import path

from .views import provider_services_by_category, provider_service_detail
from .views_ride_request import request_ride
from .views_ride_driver import driver_respond_ride
from .views_ride_status import customer_ride_status

urlpatterns = [
    path('', provider_services_by_category, name='provider_services_by_category'),
    path('<int:pk>/', provider_service_detail, name='provider_service_detail'),
    path('ride-request/', request_ride, name='ride_request'),
    path('ride-request/<int:ride_id>/respond/', driver_respond_ride, name='driver_respond_ride'),
    path('ride-request/<int:ride_id>/status/', customer_ride_status, name='customer_ride_status'),
]
