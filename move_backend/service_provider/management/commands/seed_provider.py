from django.core.management.base import BaseCommand
from service_provider.models import ServiceProvider
from service_category.models import ServiceCategory

class Command(BaseCommand):
    help = 'Seed initial service provider'

    def handle(self, *args, **options):
        # Get or create a service category
        category, _ = ServiceCategory.objects.get_or_create(slung='airport-drop-offs-pickups', defaults={
            'name': 'Airport Drop Offs & Pickups',
            'description': 'Airport transport',
            'icon': 'plane',
            'display_order': 1,
            'is_active': True,
        })
        provider, created = ServiceProvider.objects.get_or_create(
            email='provider@example.com',
            defaults={
                'provider_type': 'company',
                'name': 'Skyline Transport',
                'display_name': 'Skyline Transport',
                'phone': '+1234567890',
                'address': '123 Main St',
                'city': 'Lagos',
                'country': 'Nigeria',
            }
        )
        if created:
            provider.service_categories.add(category)
            self.stdout.write(self.style.SUCCESS(f"Created: {provider.display_name}"))
        else:
            self.stdout.write(self.style.WARNING(f"Exists: {provider.display_name}"))
