from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models_ride_request import RideRequest
from .serializers_ride_request import RideRequestSerializer
from corporate.models import Driver
from .notifications import notify_driver

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_ride(request):
    # 1. Create ride request
    serializer = RideRequestSerializer(data=request.data)
    if serializer.is_valid():
        ride = serializer.save(customer=request.user)
        # 2. Find available online drivers (simple version: any online driver)
        drivers = Driver.objects.filter(is_online=True, is_approved=True)
        if not drivers.exists():
            ride.status = "pending"
            ride.save()
            return Response({"message": "No drivers available at the moment.", "ride_id": ride.id}, status=202)
        # 3. Assign the first available driver (replace with proximity logic for production)
        driver = drivers.first()
        ride.driver = driver
        ride.status = "assigned"
        ride.save()
        # Notify driver in real time (WebSocket)
        notify_driver(driver.id, {
            "type": "ride_assigned",
            "ride_id": ride.id,
            "pickup_address": ride.pickup_address,
            "destination_address": ride.destination_address,
            "customer_id": ride.customer.id,
        })
        return Response({"message": "Ride assigned to driver.", "ride_id": ride.id, "driver_id": driver.id}, status=201)
    return Response(serializer.errors, status=400)
