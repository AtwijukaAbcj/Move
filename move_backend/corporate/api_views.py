# views.py  (FULL CLEANED VERSION)
# ------------------------------------------------------------
# Notes:
# 1) Fixed the SYNTAX ERROR in BookingTrackingAPIView (indent/docstring issue)
# 2) Moved all imports to the top + removed duplicates
# 3) Ensured Driver/Customer/Booking are imported BEFORE they are used
# 4) Left your business logic intact (sequential offers + push + OTP etc.)
# ------------------------------------------------------------

import math
import random
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from rest_framework.authtoken.models import Token

from .models import (
    Customer,
    Driver,
    Booking,
    ServiceBooking,
    ChatMessage,
    Advert,
)
from .serializers import (
    CustomerRegistrationSerializer,
    CustomerLoginSerializer,
    CustomerGoogleAuthSerializer,
    DriverDashboardSerializer,
    DriverRegistrationSerializer,
    DriverLoginSerializer,
    OtpSerializer,
    BookingSerializer,
    ServiceBookingSerializer,
    ChatMessageSerializer,
    AdvertSerializer,
)
from .push_notifications import (
    notify_driver_push,
    notify_customer_push,
    notify_all_customers_push,
    notify_all_drivers_push,
)

from . import dispatch_service


# ============================================================
# PUSH NOTIFICATIONS (TEST + TOKENS)
# ============================================================

class SendTestPushNotificationAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_type = request.data.get('user_type')  # driver, customer, all_drivers, all_customers
        user_id = request.data.get('user_id')
        title = request.data.get('title', 'Test Notification')
        message = request.data.get('message', 'This is a test push notification.')
        data = request.data.get('data', {})

        if user_type == 'driver' and user_id:
            ok = notify_driver_push(user_id, title, message, data)
        elif user_type == 'customer' and user_id:
            ok = notify_customer_push(user_id, title, message, data)
        elif user_type == 'all_drivers':
            notify_all_drivers_push(title, message, data)
            ok = True
        elif user_type == 'all_customers':
            notify_all_customers_push(title, message, data)
            ok = True
        else:
            return Response({'error': 'Invalid user_type or user_id'}, status=400)

        return Response({'success': bool(ok)})


class SaveDriverPushTokenAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, driver_id=None):
        token = request.data.get('expo_push_token')
        if not driver_id or not token:
            return Response({'error': 'Missing driver_id or expo_push_token'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Invalid driver_id'}, status=status.HTTP_400_BAD_REQUEST)

        driver.expo_push_token = token
        driver.save()
        return Response({'message': 'Expo push token saved successfully.'}, status=status.HTTP_200_OK)


class SaveCustomerPushTokenAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, customer_id=None):
        token = request.data.get('expo_push_token')
        if not customer_id or not token:
            return Response({'error': 'Missing customer_id or expo_push_token'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response({'error': 'Invalid customer_id'}, status=status.HTTP_400_BAD_REQUEST)

        customer.expo_push_token = token
        customer.save()
        return Response({'message': 'Expo push token saved successfully.'}, status=status.HTTP_200_OK)


# ============================================================
# DRIVER DASHBOARD
# ============================================================

class DriverDashboardAPIView(APIView):
    permission_classes = [AllowAny]  # You allowed checking without token

    def get(self, request, driver_id=None, *args, **kwargs):
        if not driver_id:
            return Response({'error': 'Missing driver_id'}, status=400)

        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Invalid driver_id'}, status=400)

        serializer = DriverDashboardSerializer(driver)
        return Response(serializer.data)


# ============================================================
# CUSTOMER AUTH (GOOGLE / REGISTER / LOGIN)
# ============================================================

class CustomerGoogleAuthAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomerGoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        email = serializer.validated_data['email']
        full_name = serializer.validated_data.get('name') or serializer.validated_data.get('full_name', '')
        google_id = serializer.validated_data['google_id']
        picture = serializer.validated_data.get('picture', '')

        customer, created = Customer.objects.get_or_create(
            email=email,
            defaults={'full_name': full_name, 'is_active': True}
        )

        if not created and full_name and customer.full_name != full_name:
            customer.full_name = full_name
            customer.save()

        token, _ = Token.objects.get_or_create(user=customer)

        picture_url = request.build_absolute_uri(customer.profile_picture.url) if getattr(customer, "profile_picture", None) else None

        return Response({
            'id': customer.id,
            'email': customer.email,
            'name': customer.full_name,
            'full_name': customer.full_name,
            'profile_picture': picture_url,
            'token': token.key
        })


class CustomerRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if email and Customer.objects.filter(email=email).exists():
            return Response({'error': 'An account with this email already exists'}, status=400)

        serializer = CustomerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            customer = serializer.save()
            token, _ = Token.objects.get_or_create(user=customer)

            picture_url = request.build_absolute_uri(customer.profile_picture.url) if getattr(customer, "profile_picture", None) else None

            return Response({
                'id': customer.id,
                'email': customer.email,
                'full_name': customer.full_name,
                'profile_picture': picture_url,
                'token': token.key
            }, status=201)

        return Response(serializer.errors, status=400)


class CustomerLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomerLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        customer = Customer.objects.filter(email=email).first()
        if not customer or not customer.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=401)

        if not customer.is_active:
            return Response({'error': 'Account is inactive. Contact support.'}, status=403)

        token, _ = Token.objects.get_or_create(user=customer)
        picture_url = request.build_absolute_uri(customer.profile_picture.url) if getattr(customer, "profile_picture", None) else None

        return Response({
            'id': customer.id,
            'email': customer.email,
            'full_name': customer.full_name,
            'profile_picture': picture_url,
            'token': token.key
        })


# ============================================================
# DRIVER DOCUMENT UPLOAD + VEHICLE UPDATE
# ============================================================

class DriverDocumentUploadAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]  # no auth required (as you had)

    def post(self, request, *args, **kwargs):
        user_id = request.data.get('user_id')
        document_type = request.data.get('document_type')
        file = request.FILES.get('file')

        allowed_types = [
            'drivers_license',
            'car_ownership',
            'car_image_1',
            'car_image_2',
            'inspection_report',
        ]

        if not user_id:
            return Response({'error': 'Missing user_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            driver = Driver.objects.get(id=user_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Invalid user_id'}, status=status.HTTP_400_BAD_REQUEST)

        if not document_type or document_type not in allowed_types:
            return Response({'error': 'Invalid or missing document_type'}, status=status.HTTP_400_BAD_REQUEST)

        if not file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        setattr(driver, document_type, file)
        driver.save()

        return Response({'message': f'{document_type} uploaded successfully'}, status=status.HTTP_200_OK)


class DriverUpdateVehicleAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, driver_id=None, *args, **kwargs):
        if not driver_id:
            return Response({'error': 'Missing driver_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=status.HTTP_404_NOT_FOUND)

        vehicle_number = request.data.get('vehicle_number')
        if not vehicle_number:
            return Response({'error': 'Vehicle number is required'}, status=status.HTTP_400_BAD_REQUEST)

        if driver.vehicle_number and driver.is_approved:
            return Response({
                'error': 'Cannot change vehicle number after approval. Please contact support to add a new vehicle.'
            }, status=status.HTTP_400_BAD_REQUEST)

        driver.vehicle_number = vehicle_number.strip().upper()
        driver.save()

        return Response({
            'message': 'Vehicle number updated successfully',
            'vehicle_number': driver.vehicle_number
        }, status=status.HTTP_200_OK)


# ============================================================
# DRIVER AUTH (REGISTER / LOGIN / OTP VERIFY / RESEND OTP)
# ============================================================

class DriverRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("[DEBUG] Driver registration request data:", request.data)

        serializer = DriverRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            driver = serializer.save()

            otp_code = str(random.randint(100000, 999999))
            driver.otp_code = otp_code

            otp_method = request.data.get('otp_method')
            if not otp_method:
                if driver.email and not driver.phone:
                    otp_method = 'email'
                elif driver.phone and not driver.email:
                    otp_method = 'phone'
                else:
                    otp_method = 'phone'

            driver.otp_method = otp_method
            driver.otp_verified = False
            driver.save()

            if otp_method == 'email' and driver.email:
                try:
                    send_mail(
                        'Your OTP Code',
                        f'Your OTP is {otp_code}',
                        settings.DEFAULT_FROM_EMAIL,
                        [driver.email],
                        fail_silently=False
                    )
                    print(f"[DEBUG] OTP sent to email {driver.email}")
                except Exception as e:
                    print(f"Failed to send OTP email: {e}")

            elif otp_method == 'phone' and driver.phone:
                print(f"[DEBUG] Would send OTP {otp_code} to phone {driver.phone}")

            return Response({'id': driver.id, 'otp_method': driver.otp_method}, status=201)

        print("[DEBUG] Driver registration validation errors:", serializer.errors)
        return Response(serializer.errors, status=400)


class DriverLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("LOGIN ENDPOINT HIT")
        print("[DEBUG] Login request data:", request.data)

        serializer = DriverLoginSerializer(data=request.data)
        if not serializer.is_valid():
            print("[DEBUG] Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=400)

        phone = serializer.validated_data.get('phone')
        email = serializer.validated_data.get('email')
        password = serializer.validated_data['password']

        driver = None
        if phone:
            driver = Driver.objects.filter(phone=phone).first()
        elif email:
            driver = Driver.objects.filter(email=email).first()

        if not driver:
            return Response({'error': 'Invalid credentials'}, status=401)

        if not driver.is_active:
            return Response({'error': 'Account is inactive. Contact support.'}, status=403)

        if not driver.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=401)

        if not driver.otp_verified:
            if driver.email:
                otp_code = str(random.randint(100000, 999999))
                driver.otp_code = otp_code
                driver.save()
                try:
                    send_mail(
                        'Your OTP Code',
                        f'Your OTP is {otp_code}',
                        settings.DEFAULT_FROM_EMAIL,
                        [driver.email],
                        fail_silently=False
                    )
                except Exception as e:
                    print(f"Failed to send OTP email: {e}")

            return Response({
                'error': 'OTP not verified',
                'phone': driver.phone,
                'email': driver.email
            }, status=403)

        return Response({
            'id': driver.id,
            'full_name': driver.full_name,
            'email': driver.email,
            'phone': driver.phone,
            'vehicle_number': driver.vehicle_number,
        })


class DriverOtpVerifyAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OtpSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data.get('phone')
            email = serializer.validated_data.get('email')
            otp_code = serializer.validated_data['otp_code']

            driver = None
            if phone:
                driver = Driver.objects.filter(phone=phone).first()
            elif email:
                driver = Driver.objects.filter(email=email).first()

            if driver and driver.otp_code == otp_code:
                driver.otp_verified = True
                driver.save()
                return Response({'verified': True})

            return Response({'error': 'Invalid OTP'}, status=400)

        return Response(serializer.errors, status=400)


class DriverResendOtpAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        email = request.data.get('email')

        driver = None
        if phone:
            driver = Driver.objects.filter(phone=phone).first()
        elif email:
            driver = Driver.objects.filter(email=email).first()

        if not driver:
            return Response({'error': 'Driver not found'}, status=404)

        otp_code = str(random.randint(100000, 999999))
        driver.otp_code = otp_code
        driver.save()

        if email and driver.email:
            try:
                send_mail(
                    'Your OTP Code',
                    f'Your OTP is {otp_code}',
                    settings.DEFAULT_FROM_EMAIL,
                    [driver.email],
                    fail_silently=False
                )
            except Exception as e:
                print(f"Failed to send OTP email: {e}")

        if phone and driver.phone:
            print(f"[DEBUG] Would send OTP {otp_code} to phone {driver.phone}")

        return Response({'message': 'OTP sent successfully'})


# ============================================================
# ADVERTS
# ============================================================

class AdvertListCreateAPIView(generics.ListCreateAPIView):
    queryset = Advert.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = AdvertSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        is_many = isinstance(request.data, list)
        serializer = self.get_serializer(data=request.data, many=is_many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


# ============================================================
# DRIVER ONLINE/OFFLINE
# ============================================================

class DriverSetOnlineAPIView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        is_online = request.data.get('is_online')
        if is_online is None:
            return Response({'error': 'is_online field required'}, status=400)

        if is_online:
            if hasattr(driver, "has_uploaded_documents") and not driver.has_uploaded_documents():
                return Response({
                    'error': 'Documents required',
                    'message': 'Please upload all required documents before going online.',
                    'can_go_online': False
                }, status=403)

            if not driver.is_approved:
                return Response({
                    'error': 'Approval pending',
                    'message': 'Your documents are under review. You will be able to go online once approved by admin.',
                    'can_go_online': False
                }, status=403)

            if not driver.otp_verified:
                return Response({
                    'error': 'Verification required',
                    'message': 'Please verify your phone/email before going online.',
                    'can_go_online': False
                }, status=403)

        driver.is_online = is_online
        driver.save()
        return Response({'is_online': driver.is_online, 'message': 'Status updated successfully'})


# ============================================================
# DRIVER RIDE REQUESTS (SEQUENTIAL OFFER SYSTEM)
# ============================================================

class DriverRideRequestsAPIView(APIView):
    """
    Get pending ride offers for a driver.
    Uses the sequential offer system - only shows offers specifically for this driver.
    """
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        from .models import RideOffer  # keep local if model exists in your app

        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        if hasattr(driver, "can_receive_requests") and not driver.can_receive_requests():
            if hasattr(driver, "has_uploaded_documents") and not driver.has_uploaded_documents():
                return Response({'error': 'Documents required', 'message': 'Please upload all required documents.', 'rides': []}, status=403)
            if not driver.is_approved:
                return Response({'error': 'Approval pending', 'message': 'Your documents are under review.', 'rides': []}, status=403)
            if not driver.otp_verified:
                return Response({'error': 'Verification required', 'message': 'Please verify your account.', 'rides': []}, status=403)

        dispatch_service.expire_pending_offers()

        pending_offer = RideOffer.objects.filter(
            driver=driver,
            status='pending'
        ).select_related('booking', 'booking__customer').first()

        active_bookings = Booking.objects.filter(
            driver=driver,
            status__in=['driver_assigned', 'driver_arrived', 'in_progress']
        ).order_by('-created_at')

        rides = []

        if pending_offer and not pending_offer.is_expired:
            booking = pending_offer.booking
            rides.append({
                'id': booking.id,
                'offer_id': pending_offer.id,
                'pickup_address': booking.pickup_location,
                'destination_address': booking.destination,
                'pickup_latitude': float(booking.pickup_latitude) if booking.pickup_latitude else None,
                'pickup_longitude': float(booking.pickup_longitude) if booking.pickup_longitude else None,
                'destination_latitude': float(booking.destination_latitude) if booking.destination_latitude else None,
                'destination_longitude': float(booking.destination_longitude) if booking.destination_longitude else None,
                'fare': str(booking.fare) if booking.fare else '0',
                'distance': str(booking.distance) if booking.distance else '0',
                'duration': booking.duration,
                'ride_type': booking.ride_type,
                'status': 'pending_offer',
                'customer_id': booking.customer_id,
                'customer_name': booking.customer.full_name if booking.customer else 'Customer',
                'customer_phone': booking.contact_phone or (booking.customer.phone if booking.customer else ''),
                'created_at': booking.created_at.isoformat() if booking.created_at else None,
                'is_assigned_to_me': False,
                'is_offer': True,
                'seconds_remaining': pending_offer.seconds_remaining,
                'expires_at': pending_offer.expires_at.isoformat(),
                'distance_to_pickup_km': float(pending_offer.distance_km) if pending_offer.distance_km else None,
            })
        elif pending_offer and pending_offer.is_expired:
            pending_offer.status = 'expired'
            pending_offer.save()
            dispatch_service.dispatch_ride(pending_offer.booking)

        for booking in active_bookings:
            rides.append({
                'id': booking.id,
                'offer_id': None,
                'pickup_address': booking.pickup_location,
                'destination_address': booking.destination,
                'pickup_latitude': float(booking.pickup_latitude) if booking.pickup_latitude else None,
                'pickup_longitude': float(booking.pickup_longitude) if booking.pickup_longitude else None,
                'destination_latitude': float(booking.destination_latitude) if booking.destination_latitude else None,
                'destination_longitude': float(booking.destination_longitude) if booking.destination_longitude else None,
                'fare': str(booking.fare) if booking.fare else '0',
                'distance': str(booking.distance) if booking.distance else '0',
                'duration': booking.duration,
                'ride_type': booking.ride_type,
                'status': booking.status,
                'customer_id': booking.customer_id,
                'customer_name': booking.customer.full_name if booking.customer else 'Customer',
                'customer_phone': booking.contact_phone or (booking.customer.phone if booking.customer else ''),
                'created_at': booking.created_at.isoformat() if booking.created_at else None,
                'is_assigned_to_me': True,
                'is_offer': False,
                'seconds_remaining': None,
                'expires_at': None,
                'distance_to_pickup_km': None,
            })

        return Response(rides)


# ============================================================
# DRIVER PROFILE + EARNINGS + HISTORY + WALLET + NOTIFICATIONS
# ============================================================

class DriverProfileAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        has_docs = driver.has_uploaded_documents() if hasattr(driver, "has_uploaded_documents") else False
        can_receive = driver.can_receive_requests() if hasattr(driver, "can_receive_requests") else False

        return Response({
            'id': driver.id,
            'full_name': driver.full_name,
            'phone': driver.phone,
            'email': driver.email,
            'vehicle_type': driver.vehicle_type,
            'is_approved': driver.is_approved,
            'is_online': driver.is_online,
            'otp_verified': driver.otp_verified,
            'date_joined': driver.date_joined,
            'has_uploaded_documents': has_docs,
            'can_receive_requests': can_receive,
            'documents': {
                'drivers_license': bool(getattr(driver, 'drivers_license', None)),
                'car_ownership': bool(getattr(driver, 'car_ownership', None)),
                'car_image_1': bool(getattr(driver, 'car_image_1', None)),
                'car_image_2': bool(getattr(driver, 'car_image_2', None)),
                'inspection_report': bool(getattr(driver, 'inspection_report', None)),
            },
            'approval_notes': getattr(driver, 'approval_notes', ''),
        })

    def patch(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        if 'full_name' in request.data:
            driver.full_name = request.data['full_name']
        if 'vehicle_type' in request.data:
            driver.vehicle_type = request.data['vehicle_type']
        if 'phone' in request.data:
            driver.phone = request.data['phone']
        if 'email' in request.data:
            driver.email = request.data['email']

        driver.save()
        return Response({'message': 'Profile updated successfully'})


class DriverEarningsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        try:
            Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        return Response({
            'today': 0,
            'this_week': 0,
            'this_month': 0,
            'total': 0,
            'currency': 'USD'
        })


class DriverTripHistoryAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        try:
            Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        return Response([])


class DriverWalletAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        try:
            Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        return Response({
            'balance': 0,
            'pending': 0,
            'currency': 'USD',
            'transactions': []
        })


class DriverNotificationsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        from .models import DriverNotification

        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        unread_only = request.query_params.get('unread_only', 'false').lower() == 'true'

        notifications = DriverNotification.objects.filter(driver=driver)
        if unread_only:
            notifications = notifications.filter(is_read=False)

        notifications = notifications[:20]

        return Response([{
            'id': n.id,
            'type': n.notification_type,
            'title': n.title,
            'message': n.message,
            'booking_id': n.booking_id,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
        } for n in notifications])

    def post(self, request, driver_id):
        from .models import DriverNotification

        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        notification_ids = request.data.get('notification_ids', [])
        mark_all = request.data.get('mark_all', False)

        if mark_all:
            DriverNotification.objects.filter(driver=driver, is_read=False).update(is_read=True)
        elif notification_ids:
            DriverNotification.objects.filter(driver=driver, id__in=notification_ids, is_read=False).update(is_read=True)

        return Response({'message': 'Notifications marked as read'})


# ============================================================
# DRIVER ACCEPT / REJECT (SEQUENTIAL OFFER SYSTEM)
# ============================================================

class DriverAcceptRideAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, driver_id):
        from .models import RideOffer

        ride_request_id = request.data.get('ride_request_id')
        offer_id = request.data.get('offer_id')

        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        offer = None
        if offer_id:
            try:
                offer = RideOffer.objects.get(id=offer_id, driver=driver)
            except RideOffer.DoesNotExist:
                return Response({'error': 'Offer not found'}, status=404)
        elif ride_request_id:
            offer = RideOffer.objects.filter(booking_id=ride_request_id, driver=driver, status='pending').first()

            if not offer:
                try:
                    booking = Booking.objects.get(id=ride_request_id)
                except Booking.DoesNotExist:
                    return Response({'error': 'Booking not found'}, status=404)

                if booking.status in ['completed', 'cancelled']:
                    return Response({'error': f'This ride has been {booking.status}'}, status=400)

                if booking.driver and booking.driver.id != driver_id:
                    return Response({'error': 'This ride has been assigned to another driver'}, status=400)

                booking.driver = driver
                booking.status = 'driver_assigned'
                booking.save()

                return Response({
                    'message': 'Ride accepted successfully',
                    'status': 'driver_assigned',
                    'booking_id': booking.id,
                    'pickup': booking.pickup_location,
                    'destination': booking.destination,
                    'customer_name': booking.customer.full_name if booking.customer else 'Customer',
                    'customer_phone': booking.contact_phone or (booking.customer.phone if booking.customer else ''),
                })
        else:
            return Response({'error': 'ride_request_id or offer_id required'}, status=400)

        success, message = dispatch_service.accept_offer(offer)
        if not success:
            return Response({'error': message}, status=400)

        booking = offer.booking

        if booking.customer:
            notify_customer_push(
                booking.customer.id,
                "Driver Assigned",
                f"Your ride has been confirmed! Driver: {booking.driver.full_name}, Phone: {booking.driver.phone}"
            )

        notify_driver_push(
            booking.driver.id,
            "New Ride Confirmed",
            f"You have a new ride from {booking.pickup_location} to {booking.destination}."
        )

        return Response({
            'message': 'Ride accepted successfully',
            'status': 'driver_assigned',
            'booking_id': booking.id,
            'offer_id': offer.id,
            'pickup': booking.pickup_location,
            'destination': booking.destination,
            'customer_name': booking.customer.full_name if booking.customer else 'Customer',
            'customer_phone': booking.contact_phone or (booking.customer.phone if booking.customer else ''),
        })


class DriverRejectRideAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, driver_id):
        from .models import RideOffer

        ride_request_id = request.data.get('ride_request_id')
        offer_id = request.data.get('offer_id')

        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        offer = None
        if offer_id:
            try:
                offer = RideOffer.objects.get(id=offer_id, driver=driver)
            except RideOffer.DoesNotExist:
                return Response({'error': 'Offer not found'}, status=404)
        elif ride_request_id:
            offer = RideOffer.objects.filter(booking_id=ride_request_id, driver=driver, status='pending').first()

            if not offer:
                try:
                    booking = Booking.objects.get(id=ride_request_id)
                except Booking.DoesNotExist:
                    return Response({'error': 'Booking not found'}, status=404)

                if booking.driver and booking.driver.id == driver_id:
                    booking.driver = None
                    booking.status = 'searching_driver'
                    booking.save()
                    dispatch_service.dispatch_ride(booking)

                return Response({'message': 'Ride rejected', 'status': 'rejected'})
        else:
            return Response({'error': 'ride_request_id or offer_id required'}, status=400)

        success, message, next_offer = dispatch_service.decline_offer(offer, dispatch_next=True)
        if not success:
            return Response({'error': message}, status=400)

        response_data = {'message': 'Ride declined', 'status': 'declined'}
        if next_offer:
            response_data['next_driver_notified'] = True
        else:
            response_data['next_driver_notified'] = False
            response_data['info'] = 'No more available drivers'

        return Response(response_data)


# ============================================================
# BOOKINGS (LIST/CREATE + DETAIL + CUSTOMER/DRIVER LISTS)
# ============================================================

class BookingListCreateAPIView(generics.ListCreateAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        logger = logging.getLogger(__name__)
        booking = serializer.save(status='searching_driver')

        try:
            offer = dispatch_service.dispatch_ride(booking)
            if offer:
                logger.info(f"Booking #{booking.id} - Offer sent to driver #{offer.driver_id}")
            else:
                logger.warning(f"Booking #{booking.id} - No available drivers found")
        except Exception as e:
            logger.error(f"Booking #{booking.id} - Dispatch error: {str(e)}")


class BookingDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]


class CustomerBookingsAPIView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')
        return Booking.objects.filter(customer_id=customer_id).order_by('-created_at')


class DriverBookingsAPIView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        driver_id = self.kwargs.get('driver_id')
        return Booking.objects.filter(driver_id=driver_id).order_by('-created_at')


# ============================================================
# CUSTOMER PROFILE PICTURE + PROFILE
# ============================================================

class CustomerProfilePictureUploadAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]

    def post(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)

        if 'profile_picture' not in request.FILES:
            return Response({'error': 'No profile picture provided'}, status=400)

        if customer.profile_picture:
            customer.profile_picture.delete()

        customer.profile_picture = request.FILES['profile_picture']
        customer.save()

        picture_url = request.build_absolute_uri(customer.profile_picture.url) if customer.profile_picture else None

        return Response({
            'message': 'Profile picture uploaded successfully',
            'profile_picture': picture_url
        })

    def delete(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)

        if customer.profile_picture:
            customer.profile_picture.delete()
            customer.save()
            return Response({'message': 'Profile picture deleted successfully'})

        return Response({'error': 'No profile picture to delete'}, status=400)


class CustomerProfileAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)

        picture_url = request.build_absolute_uri(customer.profile_picture.url) if getattr(customer, "profile_picture", None) else None

        return Response({
            'id': customer.id,
            'email': customer.email,
            'full_name': customer.full_name,
            'phone': customer.phone,
            'profile_picture': picture_url,
            'date_joined': customer.date_joined,
        })

    def patch(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)

        if 'full_name' in request.data:
            customer.full_name = request.data['full_name']
        if 'phone' in request.data:
            customer.phone = request.data['phone']

        customer.save()

        picture_url = request.build_absolute_uri(customer.profile_picture.url) if getattr(customer, "profile_picture", None) else None

        return Response({'message': 'Profile updated successfully', 'profile_picture': picture_url})


# ============================================================
# EMAIL RECEIPT + COMPLETE BOOKING + CANCEL BOOKING
# ============================================================

def send_booking_receipt(booking):
    if not booking.customer or not booking.customer.email:
        return False

    try:
        subject = f'MOVE Ride Receipt - Booking #{booking.id}'
        ride_type_display = dict(booking.RIDE_TYPE_CHOICES).get(booking.ride_type, booking.ride_type)

        message = f"""
Dear {booking.customer.full_name},

Thank you for riding with MOVE! Here is your receipt:

Booking ID: #{booking.id}
Date: {booking.completed_at.strftime('%B %d, %Y at %I:%M %p') if booking.completed_at else booking.created_at.strftime('%B %d, %Y at %I:%M %p')}

Ride Details:
- Type: {ride_type_display}
- Pickup: {booking.pickup_location}
- Destination: {booking.destination}
- Distance: {booking.distance} km
- Duration: {booking.duration} minutes

Payment:
- Method: {dict(booking.PAYMENT_METHOD_CHOICES).get(booking.payment_method, booking.payment_method)}
- Amount: ${booking.fare}

Driver: {booking.driver.full_name if booking.driver else 'N/A'}

Thank you for choosing MOVE!
We hope to serve you again soon.

Best regards,
The MOVE Team
        """

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [booking.customer.email],
            fail_silently=False
        )

        booking.receipt_sent = True
        booking.receipt_sent_at = timezone.now()
        booking.save()

        return True
    except Exception as e:
        print(f"Failed to send receipt email: {e}")
        return False


class CompleteBookingAPIView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        booking.status = 'completed'
        booking.completed_at = timezone.now()
        booking.payment_completed = True
        booking.save()

        if booking.customer:
            notify_customer_push(booking.customer.id, "Ride Completed", "Your ride has been completed. Thank you for riding with us!")
        if booking.driver:
            notify_driver_push(booking.driver.id, "Ride Completed", "You have completed the ride.")

        receipt_sent = send_booking_receipt(booking)

        return Response({
            'message': 'Booking completed successfully',
            'booking_id': booking.id,
            'receipt_sent': receipt_sent,
            'status': booking.status
        })


class CancelBookingAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, booking_id):
        from .models import RideOffer, DriverNotification

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        if booking.status in ['completed', 'cancelled']:
            return Response({'error': f'Cannot cancel a {booking.status} booking'}, status=400)

        assigned_driver = booking.driver

        booking.status = 'cancelled'
        booking.driver = None
        booking.save()

        if booking.customer:
            notify_customer_push(booking.customer.id, "Booking Cancelled", "Your ride has been cancelled.")
        if assigned_driver:
            notify_driver_push(
                assigned_driver.id,
                "Ride Cancelled",
                f"The customer has cancelled their ride from {booking.pickup_location} to {booking.destination}. You are now available for new rides."
            )

            DriverNotification.objects.create(
                driver=assigned_driver,
                booking=booking,
                notification_type='ride_cancelled',
                title='Ride Cancelled',
                message=f'The customer has cancelled their ride from {booking.pickup_location} to {booking.destination}. You are now available for new rides.'
            )

            assigned_driver.is_online = True
            assigned_driver.save()

        RideOffer.objects.filter(booking=booking, status='pending').update(status='expired')

        return Response({
            'message': 'Booking cancelled successfully',
            'booking_id': booking.id,
            'status': booking.status,
            'driver_notified': assigned_driver is not None
        })


# ============================================================
# ✅ FIXED: BOOKING TRACKING (THIS WAS YOUR SYNTAX ERROR)
# ============================================================

class BookingTrackingAPIView(APIView):
    """
    Get real-time tracking info for a booking
    """
    permission_classes = [AllowAny]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        response_data = {
            'booking_id': booking.id,
            'status': booking.status,
            'pickup': {
                'address': booking.pickup_location,
                'latitude': float(booking.pickup_latitude) if booking.pickup_latitude else None,
                'longitude': float(booking.pickup_longitude) if booking.pickup_longitude else None,
            },
            'destination': {
                'address': booking.destination,
                'latitude': float(booking.destination_latitude) if booking.destination_latitude else None,
                'longitude': float(booking.destination_longitude) if booking.destination_longitude else None,
            },
        }

        if booking.driver:
            response_data['driver_location'] = {
                'latitude': float(booking.driver.current_latitude) if booking.driver.current_latitude else None,
                'longitude': float(booking.driver.current_longitude) if booking.driver.current_longitude else None,
            }
            response_data['driver'] = {
                'id': booking.driver.id,
                'name': booking.driver.full_name,
                'phone': booking.driver.phone,
                'vehicle_type': booking.driver.vehicle_type,
                'vehicle_number': booking.driver.vehicle_number or 'MOV-0000',
                'rating': float(booking.driver.rating) if booking.driver.rating else 5.0,
            }

        return Response(response_data)


# ============================================================
# DISTANCE + ASSIGN NEAREST DRIVER + UPDATE DRIVER LOCATION
# ============================================================

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371
    lat1_rad = math.radians(float(lat1))
    lat2_rad = math.radians(float(lat2))
    delta_lat = math.radians(float(lat2) - float(lat1))
    delta_lon = math.radians(float(lon2) - float(lon1))

    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class AssignNearestDriverAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        if not booking.pickup_latitude or not booking.pickup_longitude:
            return Response({'error': 'Pickup coordinates required'}, status=400)

        available_drivers = Driver.objects.filter(
            is_online=True,
            is_approved=True,
            is_active=True,
            current_latitude__isnull=False,
            current_longitude__isnull=False
        ).exclude(
            bookings__status__in=['driver_assigned', 'picked_up', 'driver_arrived']
        )

        if not available_drivers.exists():
            booking.status = 'searching_driver'
            booking.save()
            return Response({'message': 'No drivers available at the moment', 'status': 'searching_driver'}, status=202)

        nearest_driver = None
        min_distance = float('inf')

        for driver in available_drivers:
            distance = calculate_distance(
                booking.pickup_latitude, booking.pickup_longitude,
                driver.current_latitude, driver.current_longitude
            )
            if distance < min_distance:
                min_distance = distance
                nearest_driver = driver

        if not nearest_driver:
            return Response({'error': 'No suitable driver found'}, status=404)

        booking.driver = nearest_driver
        booking.status = 'driver_assigned'
        booking.save()

        if booking.customer:
            notify_customer_push(
                booking.customer.id,
                "Driver Assigned",
                f"Your ride has been confirmed! Driver: {nearest_driver.full_name}, Phone: {nearest_driver.phone}"
            )
        notify_driver_push(
            nearest_driver.id,
            "New Ride Confirmed",
            f"You have a new ride from {booking.pickup_location} to {booking.destination}."
        )

        return Response({
            'message': 'Driver assigned successfully',
            'driver_id': nearest_driver.id,
            'driver_name': nearest_driver.full_name,
            'driver_phone': nearest_driver.phone,
            'vehicle_type': nearest_driver.vehicle_type or 'Standard Vehicle',
            'distance': round(min_distance, 2),
            'status': booking.status
        })


class UpdateDriverLocationAPIView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)

        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        if latitude is None or longitude is None:
            return Response({'error': 'Latitude and longitude required'}, status=400)

        driver.current_latitude = latitude
        driver.current_longitude = longitude
        driver.location_updated_at = timezone.now()
        driver.save()

        return Response({
            'message': 'Location updated successfully',
            'latitude': driver.current_latitude,
            'longitude': driver.current_longitude
        })


# ============================================================
# SERVICE BOOKINGS
# ============================================================

class ServiceBookingListCreateAPIView(generics.ListCreateAPIView):
    queryset = ServiceBooking.objects.all()
    serializer_class = ServiceBookingSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        customer_id = self.request.data.get('customer')
        serializer.save()  # keep your existing logic


class CustomerServiceBookingsAPIView(generics.ListAPIView):
    serializer_class = ServiceBookingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')
        return ServiceBooking.objects.filter(customer_id=customer_id).order_by('-created_at')


# ============================================================
# CHAT
# ============================================================

class ChatSendMessageAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        sender_type = request.data.get('sender_type')  # customer / driver
        message = request.data.get('message')
        sender_customer_id = request.data.get('sender_customer_id')
        sender_driver_id = request.data.get('sender_driver_id')

        if not booking_id or not sender_type or not message:
            return Response({'error': 'booking_id, sender_type, and message are required'}, status=400)

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        chat_message = ChatMessage.objects.create(
            booking=booking,
            sender_type=sender_type,
            sender_customer_id=sender_customer_id if sender_type == 'customer' else None,
            sender_driver_id=sender_driver_id if sender_type == 'driver' else None,
            message=message
        )

        serializer = ChatMessageSerializer(chat_message)
        return Response(serializer.data, status=201)


class ChatMessagesAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        messages = ChatMessage.objects.filter(booking=booking).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)


class ChatMarkReadAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message_ids = request.data.get('message_ids', [])
        if not message_ids:
            return Response({'error': 'message_ids array is required'}, status=400)

        ChatMessage.objects.filter(id__in=message_ids).update(is_read=True)
        return Response({'message': 'Messages marked as read'})


class ChatUnreadCountAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=404)

        receiver_type = request.query_params.get('receiver_type')  # customer / driver
        if receiver_type == 'customer':
            unread_count = ChatMessage.objects.filter(booking=booking, sender_type='driver', is_read=False).count()
        elif receiver_type == 'driver':
            unread_count = ChatMessage.objects.filter(booking=booking, sender_type='customer', is_read=False).count()
        else:
            return Response({'error': 'receiver_type (customer or driver) is required'}, status=400)

        return Response({'unread_count': unread_count})
