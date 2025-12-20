from django.urls import path
from .views import ServiceCategoryListAPIView

urlpatterns = [
    path('categories/', ServiceCategoryListAPIView.as_view(), name='service-category-list'),
]
