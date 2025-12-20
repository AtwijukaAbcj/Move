from rest_framework import generics
from .models import ServiceCategory
from .serializers import ServiceCategorySerializer

class ServiceCategoryListAPIView(generics.ListAPIView):
    queryset = ServiceCategory.objects.filter(is_active=True).order_by('display_order')
    serializer_class = ServiceCategorySerializer
