from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import ProviderService
from .serializers_provider_service import ProviderServiceSerializer

class ProviderServiceListView(generics.ListAPIView):
    serializer_class = ProviderServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ProviderService.objects.all()
        category_id = self.request.query_params.get('service_category')
        if category_id:
            queryset = queryset.filter(service_category_id=category_id)
        return queryset
