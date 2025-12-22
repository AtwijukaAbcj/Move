from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Customer
from .serializers import CustomerRegistrationSerializer, CustomerLoginSerializer, CustomerGoogleAuthSerializer
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

    def create(self, request, *args, **kwargs):
        # If request.data is a list, handle bulk create
        is_many = isinstance(request.data, list)
        serializer = self.get_serializer(data=request.data, many=is_many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
