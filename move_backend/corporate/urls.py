from django.urls import path
from .api_views import (
    AdvertListCreateAPIView, DriverRegisterAPIView, DriverLoginAPIView, 
    DriverOtpVerifyAPIView, DriverDocumentUploadAPIView, CustomerRegisterAPIView, 
    CustomerLoginAPIView, CustomerGoogleAuthAPIView, DriverDashboardAPIView,
    DriverSetOnlineAPIView, DriverRideRequestsAPIView, DriverResendOtpAPIView,
    DriverProfileAPIView, DriverEarningsAPIView, DriverTripHistoryAPIView,
    DriverWalletAPIView, DriverAcceptRideAPIView, DriverRejectRideAPIView,
    BookingListCreateAPIView, BookingDetailAPIView, CustomerBookingsAPIView, 
    DriverBookingsAPIView, CompleteBookingAPIView, AssignNearestDriverAPIView,
    UpdateDriverLocationAPIView, CustomerProfilePictureUploadAPIView, CustomerProfileAPIView,
    ServiceBookingListCreateAPIView, CustomerServiceBookingsAPIView
)
from .api_views_provider_service import ProviderServiceListView

urlpatterns = [
    path('adverts/', AdvertListCreateAPIView.as_view(), name='advert-list'),
    path('driver/register/', DriverRegisterAPIView.as_view(), name='driver-register'),
    path('driver/login/', DriverLoginAPIView.as_view(), name='driver-login'),
    path('driver/verify-otp/', DriverOtpVerifyAPIView.as_view(), name='driver-verify-otp'),
    path('driver/resend-otp/', DriverResendOtpAPIView.as_view(), name='driver-resend-otp'),
    path('driver/upload-document/', DriverDocumentUploadAPIView.as_view(), name='driver-upload-document'),
    path('driver/<int:driver_id>/status/', DriverDashboardAPIView.as_view(), name='driver-status'),
    path('driver/<int:driver_id>/set-online/', DriverSetOnlineAPIView.as_view(), name='driver-set-online'),
    path('driver/<int:driver_id>/ride-requests/', DriverRideRequestsAPIView.as_view(), name='driver-ride-requests'),
    path('driver/<int:driver_id>/profile/', DriverProfileAPIView.as_view(), name='driver-profile'),
    path('driver/<int:driver_id>/earnings/', DriverEarningsAPIView.as_view(), name='driver-earnings'),
    path('driver/<int:driver_id>/trips/', DriverTripHistoryAPIView.as_view(), name='driver-trips'),
    path('driver/<int:driver_id>/wallet/', DriverWalletAPIView.as_view(), name='driver-wallet'),
    path('driver/<int:driver_id>/accept-ride/', DriverAcceptRideAPIView.as_view(), name='driver-accept-ride'),
    path('driver/<int:driver_id>/reject-ride/', DriverRejectRideAPIView.as_view(), name='driver-reject-ride'),
    path('driver/<int:driver_id>/location/', UpdateDriverLocationAPIView.as_view(), name='driver-update-location'),
    path('customer/register/', CustomerRegisterAPIView.as_view(), name='customer-register'),
    path('customer/login/', CustomerLoginAPIView.as_view(), name='customer-login'),
    path('customer/google-auth/', CustomerGoogleAuthAPIView.as_view(), name='customer-google-auth'),
    path('customer/<int:customer_id>/profile/', CustomerProfileAPIView.as_view(), name='customer-profile'),
    path('customer/<int:customer_id>/profile-picture/', CustomerProfilePictureUploadAPIView.as_view(), name='customer-profile-picture'),
    path('provider-services/', ProviderServiceListView.as_view(), name='provider-service-list'),
    
    # Booking endpoints
    path('bookings/', BookingListCreateAPIView.as_view(), name='booking-list-create'),
    path('bookings/<int:pk>/', BookingDetailAPIView.as_view(), name='booking-detail'),
    path('bookings/<int:booking_id>/complete/', CompleteBookingAPIView.as_view(), name='booking-complete'),
    path('bookings/<int:booking_id>/assign-driver/', AssignNearestDriverAPIView.as_view(), name='booking-assign-driver'),
    path('customer/<int:customer_id>/bookings/', CustomerBookingsAPIView.as_view(), name='customer-bookings'),
    path('driver/<int:driver_id>/bookings/', DriverBookingsAPIView.as_view(), name='driver-bookings'),
    
    # Service Booking endpoints
    path('service-bookings/', ServiceBookingListCreateAPIView.as_view(), name='service-booking-list-create'),
    path('customer/<int:customer_id>/service-bookings/', CustomerServiceBookingsAPIView.as_view(), name='customer-service-bookings'),
]
