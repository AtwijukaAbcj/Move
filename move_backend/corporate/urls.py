from django.urls import path
from .api_views import AdvertListCreateAPIView, DriverRegisterAPIView, DriverLoginAPIView, DriverOtpVerifyAPIView, DriverDocumentUploadAPIView

urlpatterns = [
    path('adverts/', AdvertListCreateAPIView.as_view(), name='advert-list'),
    path('driver/register/', DriverRegisterAPIView.as_view(), name='driver-register'),
    path('driver/login/', DriverLoginAPIView.as_view(), name='driver-login'),
    path('driver/verify-otp/', DriverOtpVerifyAPIView.as_view(), name='driver-verify-otp'),
    path('driver/upload-document/', DriverDocumentUploadAPIView.as_view(), name='driver-upload-document'),
]
