from django.core.management.base import BaseCommand
from provider_service.models import ProviderService
from service_provider.models import ServiceProvider
from service_category.models import ServiceCategory

class Command(BaseCommand):
    help = 'Seed a provider service for a service provider'

    def handle(self, *args, **options):
        try:
            provider = ServiceProvider.objects.get(email='provider@example.com')
        except ServiceProvider.DoesNotExist:
            self.stdout.write(self.style.ERROR('ServiceProvider not found.'))
            return
        try:
            category = ServiceCategory.objects.get(slung='airport-drop-offs-pickups')
        except ServiceCategory.DoesNotExist:
            self.stdout.write(self.style.ERROR('ServiceCategory not found.'))
            return
        service, created = ProviderService.objects.get_or_create(
            service_provider=provider,
            service_category=category,
            title='Airport Pickup',
            defaults={
                'short_description': 'Pickup from airport to city center',
                'full_description': 'Comfortable and reliable airport pickup service.',
                'pricing_type': 'flat',
                'base_price': 50.00,
                'currency': 'USD',
                'booking_mode': 'instant',
                'max_passengers': 4,
                'max_luggage': 3,
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Created: {service.title}"))
        else:
            self.stdout.write(self.style.WARNING(f"Exists: {service.title}"))
