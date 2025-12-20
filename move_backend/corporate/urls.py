from django.urls import path
from .api_views import AdvertListAPIView

urlpatterns = [
    path('adverts/', AdvertListAPIView.as_view(), name='advert-list'),
]
