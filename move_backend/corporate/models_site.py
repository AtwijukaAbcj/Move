from django.db import models

class SiteSetting(models.Model):
    site_name = models.CharField(max_length=100, default="MOVE")
    logo = models.ImageField(upload_to="site_logos/", blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.site_name
