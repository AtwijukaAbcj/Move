from rest_framework import serializers
from .models_site import SiteSetting

class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = ["site_name", "logo", "updated_at"]
