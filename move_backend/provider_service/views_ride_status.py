from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models_ride_request import RideRequest
from .serializers_ride_request import RideRequestSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_ride_status(request, ride_id):
    """
    Customer polls for ride status updates. Only the requesting customer can access.
    """
    try:
        ride = RideRequest.objects.get(id=ride_id)
    except RideRequest.DoesNotExist:
        return Response({"error": "Ride not found."}, status=404)
    if ride.customer != request.user:
        return Response({"error": "Not authorized for this ride."}, status=403)
    serializer = RideRequestSerializer(ride)
    return Response(serializer.data)
