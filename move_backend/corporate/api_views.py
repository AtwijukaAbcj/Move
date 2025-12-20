from rest_framework import generics
from .models import Advert
from .serializers import AdvertSerializer

from rest_framework.response import Response
from rest_framework import status

class AdvertListCreateAPIView(generics.ListCreateAPIView):
    queryset = Advert.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = AdvertSerializer

    def create(self, request, *args, **kwargs):
        # If request.data is a list, handle bulk create
        is_many = isinstance(request.data, list)
        serializer = self.get_serializer(data=request.data, many=is_many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
