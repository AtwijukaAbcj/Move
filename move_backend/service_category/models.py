from django.db import models

class ServiceCategory(models.Model):
    name = models.CharField(max_length=255)
    slung = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to='service_category_images/', blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
