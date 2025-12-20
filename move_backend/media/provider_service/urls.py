from django.urls import path
from .views import ProviderServiceListAPIView, ProviderServiceRetrieveAPIView

urlpatterns = [
    path('', ProviderServiceListAPIView.as_view(), name='provider-service-list'),
    path('<int:pk>/', ProviderServiceRetrieveAPIView.as_view(), name='provider-service-detail'),
]
