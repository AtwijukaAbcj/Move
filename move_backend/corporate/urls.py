from django.urls import path
from .api_views import AdvertListCreateAPIView, DriverRegisterAPIView, DriverLoginAPIView, DriverOtpVerifyAPIView, DriverDocumentUploadAPIView, CustomerRegisterAPIView, CustomerLoginAPIView, CustomerGoogleAuthAPIView
from .api_views_provider_service import ProviderServiceListView

urlpatterns = [
    path('adverts/', AdvertListCreateAPIView.as_view(), name='advert-list'),
    path('driver/register/', DriverRegisterAPIView.as_view(), name='driver-register'),
    path('driver/login/', DriverLoginAPIView.as_view(), name='driver-login'),
    path('driver/verify-otp/', DriverOtpVerifyAPIView.as_view(), name='driver-verify-otp'),
    path('driver/upload-document/', DriverDocumentUploadAPIView.as_view(), name='driver-upload-document'),
    path('customer/register/', CustomerRegisterAPIView.as_view(), name='customer-register'),
    path('customer/login/', CustomerLoginAPIView.as_view(), name='customer-login'),
    path('customer/google-auth/', CustomerGoogleAuthAPIView.as_view(), name='customer-google-auth'),
    path('provider-services/', ProviderServiceListView.as_view(), name='provider-service-list'),
]
