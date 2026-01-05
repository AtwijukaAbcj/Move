from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Customer, Driver
from .serializers import CustomerRegistrationSerializer, CustomerLoginSerializer, CustomerGoogleAuthSerializer, DriverDashboardSerializer

# API endpoint for driver dashboard/status
from rest_framework.permissions import IsAuthenticated

class DriverDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, driver_id=None, *args, **kwargs):
        if not driver_id:
            return Response({'error': 'Missing driver_id'}, status=400)
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Invalid driver_id'}, status=400)
        serializer = DriverDashboardSerializer(driver)
        return Response(serializer.data)
# Google registration/login endpoint
class CustomerGoogleAuthAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework.authtoken.models import Token
        serializer = CustomerGoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        email = serializer.validated_data['email']
        full_name = serializer.validated_data['full_name']
        google_id = serializer.validated_data['google_id']
        customer, created = Customer.objects.get_or_create(email=email, defaults={
            'full_name': full_name,
            'is_active': True,
        })
        # Optionally, store google_id in a profile field or log for audit
        if not created:
            # Update name if changed
            if customer.full_name != full_name:
                customer.full_name = full_name
                customer.save()
        # Get or create token
        token, _ = Token.objects.get_or_create(user=customer)
        return Response({'id': customer.id, 'email': customer.email, 'full_name': customer.full_name, 'token': token.key})
# Customer registration endpoint
from rest_framework.permissions import AllowAny

class CustomerRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework.authtoken.models import Token
        serializer = CustomerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            customer = serializer.save()
            # Get or create token for the new customer
            token, _ = Token.objects.get_or_create(user=customer)
            return Response({'id': customer.id, 'email': customer.email, 'full_name': customer.full_name, 'token': token.key}, status=201)
        return Response(serializer.errors, status=400)

# Customer login endpoint
class CustomerLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework.authtoken.models import Token
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
        # Get or create token
        token, _ = Token.objects.get_or_create(user=customer)
        return Response({'id': customer.id, 'email': customer.email, 'full_name': customer.full_name, 'token': token.key})

from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
# API endpoint for driver document upload
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
# ...existing code...


class DriverDocumentUploadAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = []  # No authentication required

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
from .models import Driver
from .serializers import DriverRegistrationSerializer, DriverLoginSerializer, OtpSerializer
from rest_framework.views import APIView
import random
from django.core.mail import send_mail

class DriverRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DriverRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            driver = serializer.save()
            # Generate OTP
            otp_code = str(random.randint(100000, 999999))
            driver.otp_code = otp_code
            driver.otp_method = request.data.get('otp_method', 'phone')
            driver.otp_verified = False
            driver.save()
            # Send OTP to email if email is present
            if driver.email:
                from django.conf import settings
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
            # Send OTP to phone if phone is present (placeholder for SMS integration)
            if driver.phone:
                try:
                    # TODO: Integrate with your SMS provider here
                    print(f"[DEBUG] Would send OTP {otp_code} to phone {driver.phone}")
                except Exception as e:
                    print(f"Failed to send OTP SMS: {e}")
            return Response({'id': driver.id, 'otp_method': driver.otp_method}, status=201)
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
        print(f"[DEBUG] Attempting login for phone={phone}, email={email}")
        driver = None
        if phone:
            driver = Driver.objects.filter(phone=phone).first()
        elif email:
            driver = Driver.objects.filter(email=email).first()
        print(f"[DEBUG] Lookup driver: phone={phone}, email={email}, found={driver is not None}")
        if not driver:
            print("[DEBUG] No driver found for provided credentials.")
            return Response({'error': 'Invalid credentials'}, status=401)
        if not driver.is_active:
            print("[DEBUG] Driver is not active.")
            return Response({'error': 'Account is inactive. Contact support.'}, status=403)
        if not driver.check_password(password):
            print("[DEBUG] Password check failed for driver.")
            return Response({'error': 'Invalid credentials'}, status=401)
        print(f"[DEBUG] Password correct, otp_verified: {driver.otp_verified}")
        if not driver.otp_verified:
            print("[DEBUG] OTP not verified for driver.")
            # Resend OTP if using email
            if driver.email:
                from django.conf import settings
                import random
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
        # Login successful, return driver info
        print(f"[DEBUG] Login successful for driver id={driver.id}")
        return Response({'id': driver.id, 'full_name': driver.full_name})

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
from rest_framework import generics
from .models import Advert
from .serializers import AdvertSerializer

from rest_framework.response import Response
from rest_framework import status

class AdvertListCreateAPIView(generics.ListCreateAPIView):
    queryset = Advert.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = AdvertSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        # If request.data is a list, handle bulk create
        is_many = isinstance(request.data, list)
        serializer = self.get_serializer(data=request.data, many=is_many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


# Driver set online/offline status
class DriverSetOnlineAPIView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
        
        is_online = request.data.get('is_online')
        if is_online is not None:
            driver.is_online = is_online
            driver.save()
            return Response({'is_online': driver.is_online, 'message': 'Status updated successfully'})
        return Response({'error': 'is_online field required'}, status=400)


# Mock ride requests (to be replaced with actual ride matching logic)
class DriverRideRequestsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
        
        # For now, return empty list - this should integrate with ride request model
        # When you have a Ride/RideRequest model, query pending requests here
        return Response([])


# Driver resend OTP
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
        
        # Generate new OTP
        otp_code = str(random.randint(100000, 999999))
        driver.otp_code = otp_code
        driver.save()
        
        # Send OTP
        if email and driver.email:
            from django.conf import settings
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


# Driver profile view and update
class DriverProfileAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
        
        return Response({
            'id': driver.id,
            'full_name': driver.full_name,
            'phone': driver.phone,
            'email': driver.email,
            'vehicle_type': driver.vehicle_type,
            'is_approved': driver.is_approved,
            'is_online': driver.is_online,
            'date_joined': driver.date_joined,
        })

    def patch(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
        
        # Update allowed fields
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


# Driver earnings (mock data for now)
class DriverEarningsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
        
        # Mock earnings data - replace with actual trip/earnings model
        return Response({
            'today': 0,
            'this_week': 0,
            'this_month': 0,
            'total': 0,
            'currency': 'USD'
        })


# Driver trip history (mock data for now)
class DriverTripHistoryAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
        
        # Mock trip history - replace with actual trip model
        return Response([])


# Driver wallet (mock data for now)
class DriverWalletAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, driver_id):
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
        
        # Mock wallet data - replace with actual wallet/transaction model
        return Response({
            'balance': 0,
            'pending': 0,
            'currency': 'USD',
            'transactions': []
        })


# Driver accept ride request (mock - to be implemented with ride model)
class DriverAcceptRideAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, driver_id):
        ride_request_id = request.data.get('ride_request_id')
        
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
        
        if not ride_request_id:
            return Response({'error': 'ride_request_id required'}, status=400)
        
        # TODO: Implement with actual Ride model
        # ride = RideRequest.objects.get(id=ride_request_id)
        # ride.driver = driver
        # ride.status = 'accepted'
        # ride.save()
        
        return Response({'message': 'Ride accepted successfully', 'status': 'accepted'})


# Driver reject ride request (mock - to be implemented with ride model)
class DriverRejectRideAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, driver_id):
        ride_request_id = request.data.get('ride_request_id')
        
        try:
            driver = Driver.objects.get(id=driver_id)
        except Driver.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
        
        if not ride_request_id:
            return Response({'error': 'ride_request_id required'}, status=400)
        
        # TODO: Implement with actual Ride model
        # ride = RideRequest.objects.get(id=ride_request_id)
        # ride.rejected_by.add(driver)
        # ride.save()
        
        return Response({'message': 'Ride rejected', 'status': 'rejected'})

# Booking endpoints
from rest_framework import generics, status
from .models import Booking
from .serializers import BookingSerializer

class BookingListCreateAPIView(generics.ListCreateAPIView):
    """
    List all bookings or create a new booking
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        # Optionally set customer from authenticated user
        # if self.request.user.is_authenticated:
        #     serializer.save(customer=self.request.user)
        # else:
        serializer.save()

class BookingDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a booking
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]

class CustomerBookingsAPIView(generics.ListAPIView):
    """
    List all bookings for a specific customer
    """
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')
        return Booking.objects.filter(customer_id=customer_id).order_by('-created_at')

class DriverBookingsAPIView(generics.ListAPIView):
    """
    List all bookings for a specific driver
    """
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        driver_id = self.kwargs.get('driver_id')
        return Booking.objects.filter(driver_id=driver_id).order_by('-created_at')
