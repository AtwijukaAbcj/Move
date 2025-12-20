from django.core.management.base import BaseCommand
from service_category.models import ServiceCategory

class Command(BaseCommand):
    help = 'Seed initial service categories'

    def handle(self, *args, **options):
        categories = [
            {
                'name': 'Airport Drop Offs & Pickups',
                'slung': 'airport-drop-offs-pickups',
                'description': 'Convenient airport transportation services.',
                'icon': 'plane',
                'image': '',
                'display_order': 1,
                'is_active': True,
            },
            {
                'name': 'Corporate Hires',
                'slung': 'corporate-hires',
                'description': 'Professional vehicles for corporate needs.',
                'icon': 'briefcase',
                'image': '',
                'display_order': 2,
                'is_active': True,
            },
            {
                'name': 'Bridal Cars',
                'slung': 'bridal-cars',
                'description': 'Luxury cars for weddings and special occasions.',
                'icon': 'heart',
                'image': '',
                'display_order': 3,
                'is_active': True,
            },
            {
                'name': 'Inter-city Trips',
                'slung': 'inter-city-trips',
                'description': 'Travel between cities with comfort.',
                'icon': 'road',
                'image': '',
                'display_order': 4,
                'is_active': True,
            },
            {
                'name': 'Rentals',
                'slung': 'rentals',
                'description': 'Flexible car rental services.',
                'icon': 'car',
                'image': '',
                'display_order': 5,
                'is_active': True,
            },
            {
                'name': 'Flight Bookings',
                'slung': 'flight-bookings',
                'description': 'Book local and international flights.',
                'icon': 'plane',
                'image': '',
                'display_order': 6,
                'is_active': True,
            },
        ]
        for cat in categories:
            obj, created = ServiceCategory.objects.get_or_create(slung=cat['slung'], defaults=cat)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {obj.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Exists: {obj.name}"))
