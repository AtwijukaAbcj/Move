from rest_framework import generics
from .models import ProviderService
from .serializers import ProviderServiceSerializer

from rest_framework import generics
from .models import ProviderService
from .serializers import ProviderServiceSerializer

class ProviderServiceListAPIView(generics.ListAPIView):
    serializer_class = ProviderServiceSerializer

    def get_queryset(self):
        queryset = ProviderService.objects.filter(is_active=True)
        service_category = self.request.query_params.get('service_category')
        if service_category:
            queryset = queryset.filter(service_category_id=service_category)
        return queryset


# New: Retrieve a single provider service by id
class ProviderServiceRetrieveAPIView(generics.RetrieveAPIView):
    queryset = ProviderService.objects.filter(is_active=True)
    serializer_class = ProviderServiceSerializer
