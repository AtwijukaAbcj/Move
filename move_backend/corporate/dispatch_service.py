"""
Sequential Offer Dispatch Service

This module handles the intelligent dispatching of ride requests to drivers
using a sequential offer system. Instead of broadcasting to all drivers,
offers are sent one at a time based on a scoring algorithm.

Flow:
1. Customer requests ride -> Booking created with status 'searching_driver'
2. Dispatch service finds best available driver based on scoring
3. Creates RideOffer with 20-second timeout
4. If driver accepts -> assign driver to booking
5. If driver declines or timeout -> mark offer as declined/expired, try next driver
6. If no drivers available -> booking status becomes 'no_driver_found'
"""

from django.utils import timezone
from django.db.models import Q, Avg, Count
from datetime import timedelta
from decimal import Decimal
from math import radians, cos, sin, asin, sqrt
import logging

logger = logging.getLogger(__name__)

# Configuration
OFFER_TIMEOUT_SECONDS = 20  # Time driver has to respond
MAX_SEARCH_RADIUS_KM = 15   # Maximum distance to search for drivers
MAX_OFFERS_PER_BOOKING = 10  # Max drivers to try before giving up


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees).
    Returns distance in kilometers.
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r


def calculate_driver_score(driver, pickup_lat, pickup_lon):
    """
    Calculate a score for a driver based on multiple factors.
    Higher score = better match.
    
    Factors considered:
    - Distance from driver to pickup (most important - 50% weight)
    - Driver rating (25% weight)
    - Acceptance rate (15% weight)
    - Idle time / time since last ride (10% weight)
    
    Returns: (score, distance_km)
    """
    from .models import RideOffer, Booking
    
    # 1. Distance score (50% weight) - closer is better
    distance_km = haversine_distance(
        driver.current_latitude or 0,
        driver.current_longitude or 0,
        pickup_lat,
        pickup_lon
    )
    
    # If driver is too far, return 0 score
    if distance_km > MAX_SEARCH_RADIUS_KM:
        return 0, distance_km
    
    # Normalize: 0km = 100 points, MAX_SEARCH_RADIUS_KM = 0 points
    distance_score = max(0, 100 - (distance_km / MAX_SEARCH_RADIUS_KM * 100))
    
    # 2. Rating score (25% weight)
    rating = float(driver.rating or 4.5)
    rating_score = (rating / 5.0) * 100
    
    # 3. Acceptance rate (15% weight)
    # Calculate from recent offers
    recent_offers = RideOffer.objects.filter(
        driver=driver,
        offered_at__gte=timezone.now() - timedelta(days=7)
    )
    total_offers = recent_offers.count()
    accepted_offers = recent_offers.filter(status='accepted').count()
    
    if total_offers > 0:
        acceptance_rate = (accepted_offers / total_offers) * 100
    else:
        acceptance_rate = 80  # Default for new drivers
    
    # 4. Idle time score (10% weight) - longer idle = higher priority
    last_ride = Booking.objects.filter(
        driver=driver,
        status='completed'
    ).order_by('-completed_at').first()
    
    if last_ride and last_ride.completed_at:
        idle_minutes = (timezone.now() - last_ride.completed_at).total_seconds() / 60
        # Cap at 60 minutes, normalize to 100 points
        idle_score = min(100, (idle_minutes / 60) * 100)
    else:
        idle_score = 50  # Default
    
    # Calculate weighted final score
    final_score = (
        distance_score * 0.50 +
        rating_score * 0.25 +
        acceptance_rate * 0.15 +
        idle_score * 0.10
    )
    
    return final_score, distance_km


def get_available_drivers(booking, excluded_driver_ids=None):
    """
    Get all available drivers sorted by score.
    Excludes drivers who have already been offered this ride.
    
    Returns: List of (driver, score, distance_km) tuples, sorted by score descending
    """
    from .models import Driver, RideOffer
    
    if excluded_driver_ids is None:
        excluded_driver_ids = []
    
    # Get drivers who have already been offered this booking
    already_offered_ids = list(
        RideOffer.objects.filter(booking=booking)
        .values_list('driver_id', flat=True)
    )
    
    # Combine exclusions
    all_excluded = set(excluded_driver_ids + already_offered_ids)
    
    # Find available drivers
    # Driver model uses: is_online (availability) and is_approved (verification)
    available_drivers = Driver.objects.filter(
        is_online=True,
        is_approved=True,
        current_latitude__isnull=False,
        current_longitude__isnull=False
    ).exclude(id__in=all_excluded)
    
    # Score each driver
    scored_drivers = []
    for driver in available_drivers:
        score, distance_km = calculate_driver_score(
            driver,
            float(booking.pickup_latitude),
            float(booking.pickup_longitude)
        )
        if score > 0:  # Only include drivers within range
            scored_drivers.append((driver, score, distance_km))
    
    # Sort by score descending
    scored_drivers.sort(key=lambda x: x[1], reverse=True)
    
    return scored_drivers


def create_ride_offer(booking, driver, score=None, distance_km=None, offer_order=1):
    """
    Create a new ride offer for a driver.
    Sets expiration time to OFFER_TIMEOUT_SECONDS from now.
    """
    from .models import RideOffer
    
    expires_at = timezone.now() + timedelta(seconds=OFFER_TIMEOUT_SECONDS)
    
    offer = RideOffer.objects.create(
        booking=booking,
        driver=driver,
        driver_score=Decimal(str(score)) if score else None,
        distance_km=Decimal(str(distance_km)) if distance_km else None,
        offer_order=offer_order,
        status='pending',
        expires_at=expires_at
    )
    
    logger.info(f"Created ride offer #{offer.id} for booking #{booking.id} to driver #{driver.id}")
    
    return offer


def dispatch_ride(booking):
    """
    Main dispatch function. Finds the best available driver and creates an offer.
    
    Returns:
    - RideOffer if a driver was found and offer created
    - None if no drivers available
    """
    from .models import RideOffer
    
    # First, expire any pending offers for this booking
    expire_pending_offers(booking)
    
    # Count how many offers have been made for this booking
    offer_count = RideOffer.objects.filter(booking=booking).count()
    
    if offer_count >= MAX_OFFERS_PER_BOOKING:
        logger.warning(f"Booking #{booking.id} has reached max offers ({MAX_OFFERS_PER_BOOKING})")
        booking.status = 'no_driver_found'
        booking.save()
        return None
    
    # Get available drivers
    scored_drivers = get_available_drivers(booking)
    
    if not scored_drivers:
        logger.warning(f"No available drivers for booking #{booking.id}")
        if offer_count > 0:
            # We've tried but no more drivers available
            booking.status = 'no_driver_found'
            booking.save()
        return None
    
    # Get the best driver
    best_driver, score, distance_km = scored_drivers[0]
    
    # Create the offer
    offer = create_ride_offer(
        booking=booking,
        driver=best_driver,
        score=score,
        distance_km=distance_km,
        offer_order=offer_count + 1
    )
    
    return offer


def expire_pending_offers(booking=None):
    """
    Mark expired pending offers as 'expired'.
    If booking is provided, only check that booking.
    Otherwise check all bookings.
    """
    from .models import RideOffer
    
    query = RideOffer.objects.filter(
        status='pending',
        expires_at__lt=timezone.now()
    )
    
    if booking:
        query = query.filter(booking=booking)
    
    expired_count = query.update(status='expired')
    
    if expired_count > 0:
        logger.info(f"Expired {expired_count} pending offer(s)")
    
    return expired_count


def accept_offer(offer):
    """
    Driver accepts the ride offer.
    Assigns driver to booking and updates statuses.
    """
    from django.db import transaction
    
    with transaction.atomic():
        # Refresh to get latest state
        offer.refresh_from_db()
        
        # Check if offer is still valid
        if offer.status != 'pending':
            return False, f"Offer is no longer pending (status: {offer.status})"
        
        if offer.is_expired:
            offer.status = 'expired'
            offer.save()
            return False, "Offer has expired"
        
        # Accept the offer
        offer.status = 'accepted'
        offer.responded_at = timezone.now()
        offer.save()
        
        # Assign driver to booking
        booking = offer.booking
        booking.driver = offer.driver
        booking.status = 'driver_assigned'
        booking.save()
        
        # Mark driver as unavailable (busy with a ride)
        driver = offer.driver
        driver.is_online = False  # Driver is now busy
        driver.save()
        
        logger.info(f"Driver #{driver.id} accepted offer #{offer.id} for booking #{booking.id}")
        
        return True, "Offer accepted successfully"


def decline_offer(offer, dispatch_next=True):
    """
    Driver declines the ride offer.
    Optionally dispatches to the next best driver.
    
    Returns: (success, message, next_offer or None)
    """
    from django.db import transaction
    
    with transaction.atomic():
        offer.refresh_from_db()
        
        if offer.status != 'pending':
            return False, f"Offer is no longer pending (status: {offer.status})", None
        
        # Decline the offer
        offer.status = 'declined'
        offer.responded_at = timezone.now()
        offer.save()
        
        logger.info(f"Driver #{offer.driver_id} declined offer #{offer.id} for booking #{offer.booking_id}")
        
        # Dispatch to next driver if requested
        next_offer = None
        if dispatch_next:
            next_offer = dispatch_ride(offer.booking)
        
        return True, "Offer declined", next_offer


def get_pending_offer_for_driver(driver):
    """
    Get the current pending offer for a driver, if any.
    Automatically expires stale offers.
    """
    from .models import RideOffer
    
    # First expire any stale offers
    expire_pending_offers()
    
    # Get pending offer for this driver
    offer = RideOffer.objects.filter(
        driver=driver,
        status='pending'
    ).select_related('booking', 'booking__customer').first()
    
    return offer


def process_expired_offers():
    """
    Background task to process expired offers and dispatch to next drivers.
    This should be called periodically (e.g., every 5 seconds).
    """
    from .models import RideOffer, Booking
    
    # Get all expired pending offers
    expired_offers = RideOffer.objects.filter(
        status='pending',
        expires_at__lt=timezone.now()
    ).select_related('booking')
    
    for offer in expired_offers:
        offer.status = 'expired'
        offer.save()
        
        # Try to dispatch to next driver
        if offer.booking.status == 'searching_driver':
            dispatch_ride(offer.booking)
    
    return len(expired_offers)
