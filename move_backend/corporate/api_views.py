from rest_framework import generics
from .models import Advert
from .serializers import AdvertSerializer

class AdvertListAPIView(generics.ListAPIView):
    queryset = Advert.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = AdvertSerializer
