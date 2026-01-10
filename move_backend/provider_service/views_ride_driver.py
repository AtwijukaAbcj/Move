from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models_ride_request import RideRequest
from .serializers_ride_request import RideRequestSerializer
from .notifications import notify_customer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def driver_respond_ride(request, ride_id):
    """
    Driver accepts or rejects a ride request.
    POST data: {"action": "accept" or "reject"}
    """
    try:
        ride = RideRequest.objects.get(id=ride_id)
    except RideRequest.DoesNotExist:
        return Response({"error": "Ride not found."}, status=404)
    # Secure: Only assigned driver can respond
    if not hasattr(request.user, "is_online") or ride.driver != request.user:
        return Response({"error": "Not authorized for this ride."}, status=403)
    action = request.data.get("action")
    if action == "accept":
        ride.status = "accepted"
        ride.save()
        # Notify customer in real time
        notify_customer(ride.customer.id, {
            "type": "ride_accepted",
            "ride_id": ride.id,
            "driver_id": ride.driver.id,
        })
        return Response({"message": "Ride accepted."})
    elif action == "reject":
        # Try to reassign to another online driver
        from corporate.models import Driver
        other_drivers = Driver.objects.filter(is_online=True, is_approved=True).exclude(id=ride.driver.id)
        if other_drivers.exists():
            new_driver = other_drivers.first()
            ride.driver = new_driver
            ride.status = "assigned"
            ride.save()
            from .notifications import notify_driver
            notify_driver(new_driver.id, {
                "type": "ride_assigned",
                "ride_id": ride.id,
                "pickup_address": ride.pickup_address,
                "destination_address": ride.destination_address,
                "customer_id": ride.customer.id,
            })
            notify_customer(ride.customer.id, {
                "type": "ride_reassigned",
                "ride_id": ride.id,
                "driver_id": new_driver.id,
            })
            return Response({"message": "Ride reassigned to another driver.", "new_driver_id": new_driver.id})
        else:
            ride.status = "rejected"
            ride.save()
            notify_customer(ride.customer.id, {
                "type": "ride_rejected",
                "ride_id": ride.id,
                "driver_id": ride.driver.id,
            })
            return Response({"message": "Ride rejected. No other drivers available."})
    else:
        return Response({"error": "Invalid action."}, status=400)
