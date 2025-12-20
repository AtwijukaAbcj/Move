from django.db import models

class Advert(models.Model):
    image = models.ImageField(upload_to='adverts/', blank=True, null=True)
    caption = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.caption
