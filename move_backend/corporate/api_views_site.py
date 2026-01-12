from rest_framework.views import APIView
from rest_framework.response import Response
from .models_site import SiteSetting
from .serializers_site import SiteSettingSerializer

class SiteSettingView(APIView):
    def get(self, request):
        setting = SiteSetting.objects.first()
        serializer = SiteSettingSerializer(setting)
        return Response(serializer.data)
