from rest_framework import generics
from .models import ServiceCategory
from .serializers import ServiceCategorySerializer

from rest_framework.permissions import AllowAny

class ServiceCategoryListAPIView(generics.ListAPIView):
    queryset = ServiceCategory.objects.filter(is_active=True).order_by('display_order')
    serializer_class = ServiceCategorySerializer
    permission_classes = [AllowAny]
