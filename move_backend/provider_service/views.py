from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ProviderService
from .serializers import ProviderServiceSerializer

@api_view(['GET', 'POST'])
def provider_services_by_category(request):
    if request.method == 'GET':
        category_id = request.GET.get('service_category')
        if not category_id:
            return Response({'error': 'service_category parameter is required'}, status=400)
        services = ProviderService.objects.filter(service_category_id=category_id, is_active=True)
        serializer = ProviderServiceSerializer(services, many=True, context={'request': request})
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = ProviderServiceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

# Detail endpoint for ProviderService
@api_view(['GET'])
def provider_service_detail(request, pk):
    service = get_object_or_404(ProviderService, pk=pk)
    serializer = ProviderServiceSerializer(service, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
