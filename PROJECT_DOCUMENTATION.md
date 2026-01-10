# Move Platform - Complete Project Documentation

## Project Overview

The Move Platform is a comprehensive transportation and service marketplace consisting of:
1. **Customer Mobile App** (React Native) - For booking rides and services
2. **Driver Mobile App** (React Native) - For drivers to receive and complete rides
3. **Django Backend** - REST API and admin management
4. **Web Dashboard** (Future) - Analytics and management

## Project Structure

```
Move/
├── move_app/                    # Customer React Native App
│   ├── app/                     # Expo Router screens
│   ├── components/              # Reusable UI components
│   ├── screens/                 # Main app screens
│   ├── api/                     # API integration
│   ├── store/                   # Redux state management
│   └── models/                  # TypeScript models
│
├── Move-driver-app/             # Driver React Native App
│   ├── screens/                 # All driver screens
│   ├── navigation/              # Tab and stack navigation
│   ├── utils/                   # Helper utilities
│   └── assets/                  # Images and fonts
│
├── move_backend/                # Django Backend
│   ├── corporate/               # Main app (drivers, customers, services)
│   │   ├── models.py           # Database models
│   │   ├── api_views.py        # API endpoints
│   │   ├── serializers.py      # DRF serializers
│   │   └── urls.py             # URL routing
│   ├── provider_service/        # Service provider models
│   ├── service_category/        # Service categories
│   ├── service_provided/        # Provided services
│   └── media/                   # Uploaded files
│
└── move_web/                    # Web Dashboard (Future)
```

## Technology Stack

### Frontend (Mobile Apps)
- **Framework**: React Native (Expo)
- **Language**: TypeScript/JavaScript
- **Navigation**: React Navigation 7.x
- **State Management**: Redux Toolkit (Customer App)
- **Icons**: Expo Vector Icons (Ionicons)
- **Storage**: Expo Secure Store
- **Maps**: React Native Maps (Customer App)

### Backend
- **Framework**: Django 4.x
- **API**: Django REST Framework
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Authentication**: Token-based (DRF TokenAuthentication)
- **File Upload**: Django File Storage
- **Email**: Django Email (OTP sending)

## Database Schema

### User Models

#### Customer
- email (unique)
- full_name
- phone
- password (hashed)
- is_active
- date_joined

#### Driver
- phone (unique)
- email (unique)
- full_name
- vehicle_type
- password (hashed)
- is_active
- is_online
- is_approved
- otp_code
- otp_verified
- drivers_license (file)
- car_ownership (file)
- car_image_1 (image)
- car_image_2 (image)
- inspection_report (file)
- approval_notes

### Service Models

#### ServiceCategory
- name
- description
- icon
- image
- display_order
- is_active

#### ProviderService
- service_category (FK)
- title
- short_description
- full_description
- base_price
- currency
- display_order
- is_active

#### Advert
- image
- caption
- is_active
- created_at

## API Documentation

### Authentication Endpoints

#### Customer Registration
```http
POST /api/corporate/customer/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "full_name": "John Doe",
  "phone": "+1234567890"
}

Response: 201 Created
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "token": "abc123..."
}
```

#### Customer Login
```http
POST /api/corporate/customer/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "token": "abc123..."
}
```

#### Driver Registration
```http
POST /api/corporate/driver/register/
Content-Type: application/json

{
  "phone": "+1234567890",
  "email": "driver@example.com",
  "full_name": "Jane Driver",
  "vehicle_type": "Car",
  "password": "secure_password"
}

Response: 201 Created
{
  "id": 1,
  "otp_method": "phone"
}
```

#### Driver Login
```http
POST /api/corporate/driver/login/
Content-Type: application/json

{
  "phone": "+1234567890",
  "password": "secure_password"
}

Response: 200 OK
{
  "id": 1,
  "full_name": "Jane Driver"
}

Response: 403 (if OTP not verified)
{
  "error": "OTP not verified",
  "phone": "+1234567890",
  "email": "driver@example.com"
}
```

#### Verify OTP
```http
POST /api/corporate/driver/verify-otp/
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp_code": "123456"
}

Response: 200 OK
{
  "verified": true
}
```

#### Resend OTP
```http
POST /api/corporate/driver/resend-otp/
Content-Type: application/json

{
  "phone": "+1234567890"
}

Response: 200 OK
{
  "message": "OTP sent successfully"
}
```

### Driver Management Endpoints

#### Get Driver Status
```http
GET /api/corporate/driver/{id}/status/
Authorization: Token abc123...

Response: 200 OK
{
  "id": 1,
  "full_name": "Jane Driver",
  "is_approved": true,
  "is_online": false,
  "vehicle_type": "Car"
}
```

#### Set Online Status
```http
PATCH /api/corporate/driver/{id}/set-online/
Content-Type: application/json

{
  "is_online": true
}

Response: 200 OK
{
  "is_online": true,
  "message": "Status updated successfully"
}
```

#### Get Driver Profile
```http
GET /api/corporate/driver/{id}/profile/

Response: 200 OK
{
  "id": 1,
  "full_name": "Jane Driver",
  "phone": "+1234567890",
  "email": "driver@example.com",
  "vehicle_type": "Car",
  "is_approved": true,
  "is_online": false,
  "date_joined": "2024-01-01T00:00:00Z"
}
```

#### Update Driver Profile
```http
PATCH /api/corporate/driver/{id}/profile/
Content-Type: application/json

{
  "full_name": "Jane Updated",
  "vehicle_type": "SUV"
}

Response: 200 OK
{
  "message": "Profile updated successfully"
}
```

#### Upload Document
```http
POST /api/corporate/driver/upload-document/
Content-Type: multipart/form-data

user_id: 1
document_type: drivers_license
file: [binary]

Response: 200 OK
{
  "message": "drivers_license uploaded successfully"
}
```

### Ride Endpoints

#### Get Ride Requests
```http
GET /api/corporate/driver/{id}/ride-requests/

Response: 200 OK
[
  {
    "id": 1,
    "pickup_location": "123 Main St",
    "destination": "456 Oak Ave",
    "fare_estimate": "$15.00",
    "distance": "5.2 miles",
    "passenger_name": "John Doe"
  }
]
```

#### Accept Ride
```http
POST /api/corporate/driver/{id}/accept-ride/
Content-Type: application/json

{
  "ride_request_id": 1
}

Response: 200 OK
{
  "message": "Ride accepted successfully",
  "status": "accepted"
}
```

#### Reject Ride
```http
POST /api/corporate/driver/{id}/reject-ride/
Content-Type: application/json

{
  "ride_request_id": 1
}

Response: 200 OK
{
  "message": "Ride rejected",
  "status": "rejected"
}
```

### Financial Endpoints

#### Get Earnings
```http
GET /api/corporate/driver/{id}/earnings/

Response: 200 OK
{
  "today": 45.50,
  "this_week": 230.75,
  "this_month": 1050.00,
  "total": 5230.25,
  "currency": "USD"
}
```

#### Get Trip History
```http
GET /api/corporate/driver/{id}/trips/

Response: 200 OK
[
  {
    "id": 1,
    "pickup": "123 Main St",
    "destination": "456 Oak Ave",
    "fare": "$15.00",
    "duration": "25 min",
    "date": "2024-01-15",
    "status": "completed"
  }
]
```

#### Get Wallet
```http
GET /api/corporate/driver/{id}/wallet/

Response: 200 OK
{
  "balance": 450.75,
  "pending": 120.00,
  "currency": "USD",
  "transactions": [
    {
      "id": 1,
      "description": "Weekly payout",
      "amount": 230.75,
      "type": "credit",
      "date": "2024-01-15"
    }
  ]
}
```

### Service Endpoints

#### Get Service Categories
```http
GET /api/corporate/provider-services/

Response: 200 OK
[
  {
    "id": 1,
    "name": "Transportation",
    "description": "Ride services",
    "icon": "car",
    "services": [...]
  }
]
```

#### Get Adverts
```http
GET /api/corporate/adverts/

Response: 200 OK
[
  {
    "id": 1,
    "image": "http://example.com/media/adverts/ad1.jpg",
    "caption": "Special offer!",
    "is_active": true
  }
]
```

## Features Implemented

### Customer App (move_app)
- ✅ User registration and login
- ✅ Google Sign-In integration
- ✅ Home screen with service categories
- ✅ Service listings and details
- ✅ Provider service details
- ✅ Ride booking interface
- ✅ Map integration
- ✅ Account management
- ✅ Activity tracking

### Driver App (Move-driver-app)
- ✅ Driver registration with OTP
- ✅ Login with phone/email
- ✅ OTP verification (phone/email)
- ✅ Document upload (5 document types)
- ✅ Dashboard with online/offline toggle
- ✅ Real-time ride request polling
- ✅ Accept/reject ride requests
- ✅ Earnings tracking by period
- ✅ Trip history
- ✅ Wallet management
- ✅ Profile editing
- ✅ Support center with FAQ
- ✅ Bottom tab navigation with icons

### Backend (move_backend)
- ✅ Customer and Driver authentication
- ✅ Token-based API security
- ✅ OTP generation and verification
- ✅ Document upload and storage
- ✅ Driver approval workflow
- ✅ Online status management
- ✅ Service category management
- ✅ Provider service listings
- ✅ Advert management
- ✅ Admin panel for management

## Setup Instructions

### Backend Setup

1. **Install Python dependencies**
   ```bash
   cd move_backend
   pip install django djangorestframework pillow django-cors-headers
   ```

2. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

4. **Configure settings**
   - Update `ALLOWED_HOSTS` in settings.py
   - Configure email settings for OTP
   - Set up media files configuration

5. **Run server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### Customer App Setup

1. **Install dependencies**
   ```bash
   cd move_app
   npm install
   ```

2. **Update API URL**
   Update `api.ts` with your backend URL

3. **Run app**
   ```bash
   npm start
   ```

### Driver App Setup

1. **Install dependencies**
   ```bash
   cd Move-driver-app
   npm install
   ```

2. **Update API URLs**
   Update API_BASE in all screen files

3. **Run app**
   ```bash
   npm start
   ```

## Environment Variables

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,192.168.1.31,your-ip
DATABASE_URL=sqlite:///db.sqlite3

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@moveapp.com
```

## Testing

### Manual Testing Checklist

#### Customer App
- [ ] Register new customer
- [ ] Login with credentials
- [ ] Google Sign-In
- [ ] Browse services
- [ ] View service details
- [ ] Book a ride
- [ ] View account info

#### Driver App
- [ ] Register new driver
- [ ] Receive and verify OTP
- [ ] Login with credentials
- [ ] Upload all documents
- [ ] View dashboard (pending state)
- [ ] Admin approves driver
- [ ] Go online
- [ ] Receive ride requests
- [ ] Accept ride
- [ ] Reject ride
- [ ] View earnings
- [ ] View trip history
- [ ] Manage wallet
- [ ] Edit profile
- [ ] Contact support

#### Backend
- [ ] Admin login
- [ ] Approve/reject drivers
- [ ] View uploaded documents
- [ ] Manage service categories
- [ ] Add/edit services
- [ ] Create adverts
- [ ] View all users

## Deployment

### Backend Deployment (Production)

1. **Use PostgreSQL database**
2. **Configure static and media files**
3. **Set up Gunicorn/uWSGI**
4. **Configure Nginx reverse proxy**
5. **Enable HTTPS with Let's Encrypt**
6. **Set up SMS provider for OTP**

### Mobile App Deployment

#### iOS
- Configure Apple Developer account
- Set up provisioning profiles
- Build with EAS Build or Xcode
- Submit to App Store

#### Android
- Configure Google Play Console
- Generate signing key
- Build APK/AAB
- Submit to Play Store

## Security Considerations

1. **Authentication**
   - Passwords are hashed using Django's default PBKDF2
   - Token-based authentication for API
   - Tokens stored securely with expo-secure-store

2. **OTP Security**
   - 6-digit random OTP
   - Expires after verification
   - Rate limiting recommended

3. **File Upload**
   - Validate file types and sizes
   - Store in secure directory
   - Only admins can view documents

4. **API Security**
   - CORS configuration for allowed origins
   - Token authentication required for sensitive endpoints
   - Input validation on all endpoints

## Known Issues & Future Work

### Current Limitations
1. Ride matching algorithm not implemented (returns empty array)
2. Real-time notifications not implemented (using polling)
3. SMS provider integration needed for phone OTP
4. Payment gateway not integrated
5. Maps integration incomplete in driver app
6. No real-time location tracking

### Planned Features
1. Real-time ride matching algorithm
2. Push notifications (Firebase)
3. In-app payment processing (Stripe/PayPal)
4. Real-time location tracking
5. Trip navigation and routing
6. Driver ratings and reviews
7. Customer ratings and reviews
8. In-app messaging between driver and passenger
9. Trip analytics and reports
10. Multi-language support
11. Web dashboard for admins
12. Driver performance metrics
13. Automated payout system
14. Referral program
15. Promotional campaigns

## Support & Maintenance

### Regular Maintenance Tasks
- Monitor error logs
- Review and approve new drivers
- Process payout requests
- Respond to support tickets
- Update service listings
- Refresh adverts
- Database backups

### Monitoring
- API response times
- Error rates
- Active drivers count
- Daily trips completed
- Revenue metrics

## Contributors

This project was developed as a complete transportation platform with customer and driver mobile applications backed by a Django REST API.

## License

Proprietary - All rights reserved

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: Production Ready (MVP)
