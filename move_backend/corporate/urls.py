from django.urls import path
from .api_views import AdvertListCreateAPIView

urlpatterns = [
    path('adverts/', AdvertListCreateAPIView.as_view(), name='advert-list'),
]
