# Move App - Booking & Payment System

## Overview
The Move app now has a complete booking and payment flow allowing customers to:
1. Request rides
2. Confirm booking details
3. Select payment method (Credit Card or Mobile Money)
4. Process payment
5. View booking confirmation with driver details

## Customer App Flow

### 1. Rides Screen (`/rides`)
- Enter pickup location
- Enter destination
- Select ride type (Standard, XL, or Premium)
- Click "Request" button to proceed

### 2. Booking Confirmation (`/booking-confirm`)
Features:
- Mini map showing route
- Pickup and destination details
- Selected ride type with icon
- Price breakdown (base fare, distance, service fee)
- Total fare calculation
- "Continue to Payment" button

### 3. Payment Method Selection (`/payment-method`)
Payment Options:
- **Credit/Debit Card**
  - Card number input (16 digits, auto-formatted)
  - Cardholder name
  - Expiry date (MM/YY)
  - CVV (3 digits)
  
- **Mobile Money**
  - Provider selection (MTN, Vodafone, AirtelTigo)
  - Phone number input

Features:
- Form validation before proceeding
- Visual feedback for selected method
- Secure payment notice

### 4. Payment Processing (`/payment-process`)
- Animated progress indicator
- Payment details display
- Creates booking in backend via API
- Shows success/failure status
- Auto-navigates to success screen

### 5. Booking Success (`/booking-success`)
Features:
- Booking confirmation with checkmark
- Complete trip details
- Driver matching simulation
- Driver information (name, rating, vehicle, ETA)
- Call/Message driver buttons
- Payment method confirmation
- Unique booking ID
- "Track Your Ride" and "Back to Home" buttons

## Backend API Endpoints

### Bookings

#### Create Booking
```
POST /api/bookings/
Content-Type: application/json

{
  "pickup_location": "123 Main St",
  "destination": "456 Oak Ave",
  "ride_type": "standard",
  "fare": 25.50,
  "distance": 5.2,
  "duration": 15,
  "payment_method": "card",
  "status": "pending"
}
```

Response:
```json
{
  "id": 1,
  "customer": null,
  "customer_name": null,
  "driver": null,
  "driver_name": null,
  "pickup_location": "123 Main St",
  "destination": "456 Oak Ave",
  "ride_type": "standard",
  "fare": "25.50",
  "distance": "5.20",
  "duration": 15,
  "payment_method": "card",
  "payment_completed": false,
  "status": "pending",
  "created_at": "2025-01-04T19:23:00Z",
  "updated_at": "2025-01-04T19:23:00Z"
}
```

#### List All Bookings
```
GET /api/bookings/
```

#### Get Booking Details
```
GET /api/bookings/{id}/
```

#### Update Booking
```
PATCH /api/bookings/{id}/
Content-Type: application/json

{
  "status": "driver_assigned",
  "driver": 1
}
```

#### Get Customer Bookings
```
GET /api/customer/{customer_id}/bookings/
```

#### Get Driver Bookings
```
GET /api/driver/{driver_id}/bookings/
```

## Database Schema

### Booking Model
```python
class Booking(models.Model):
    customer = ForeignKey(Customer)
    driver = ForeignKey(Driver)
    
    pickup_location = CharField(max_length=500)
    destination = CharField(max_length=500)
    ride_type = CharField(choices=['standard', 'xl', 'premium'])
    
    fare = DecimalField(max_digits=10, decimal_places=2)
    distance = DecimalField(max_digits=10, decimal_places=2)
    duration = IntegerField()
    
    payment_method = CharField(choices=['card', 'mobilemoney'])
    payment_completed = BooleanField(default=False)
    
    status = CharField(choices=[
        'pending', 'confirmed', 'driver_assigned', 
        'picked_up', 'completed', 'cancelled'
    ])
    
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

## Navigation Flow

```
RidesScreen
    ↓ (Request button)
BookingConfirmScreen
    ↓ (Continue to Payment)
PaymentMethodScreen
    ↓ (Proceed to Payment)
PaymentProcessScreen
    ↓ (Auto-redirect on success)
BookingSuccessScreen
    ↓ (Track Ride / Back to Home)
HomeScreen / RidesScreen
```

## Features Implemented

### Frontend (React Native)
✅ 4 new screens with modern UI
✅ Route files for expo-router navigation
✅ Form validation
✅ Payment method selection (Card & Mobile Money)
✅ Payment processing with animation
✅ Booking confirmation with driver details
✅ Price calculation and breakdown
✅ Map integration for route visualization

### Backend (Django)
✅ Booking model with all required fields
✅ RESTful API endpoints (CRUD)
✅ Serializers for data validation
✅ Admin panel integration
✅ Database migrations
✅ Customer and driver relationship

## Design Theme
- Primary: #35736E
- Aqua: #5EC6C6
- Accent: #FFA726
- Dark: #23272F
- Ink: #0f1a19

All screens follow the established design system with:
- Consistent color scheme
- Modern card-based layouts
- Smooth animations
- Responsive touch feedback
- Platform-specific adjustments (iOS/Android)

## Testing the Flow

1. Start the backend server:
   ```bash
   cd move_backend
   python manage.py runserver 192.168.1.31:8000
   ```

2. Start the mobile app:
   ```bash
   cd move_app
   npm start
   ```

3. Navigate to Rides screen
4. Enter pickup and destination
5. Click Request
6. Follow the booking flow through payment
7. View booking confirmation

## Next Steps (Optional Enhancements)

1. **Real-time Driver Matching**
   - WebSocket integration for live driver updates
   - Real driver assignment algorithm

2. **Payment Gateway Integration**
   - Stripe for card payments
   - Mobile Money API integration (MTN, Vodafone, etc.)

3. **Push Notifications**
   - Booking confirmation
   - Driver assignment
   - Ride status updates

4. **Ride Tracking**
   - Real-time location updates
   - Live map with driver position
   - ETA updates

5. **Rating & Reviews**
   - Rate driver after ride
   - Review system
   - Driver ratings display

6. **Ride History**
   - Complete trip history
   - Receipt generation
   - Re-book favorite routes

7. **Promo Codes & Discounts**
   - Apply promo codes
   - Loyalty rewards
   - Referral system

## Notes

- All API endpoints currently use `AllowAny` permission
- Customer ID is optional in booking creation
- Driver matching is simulated (5 seconds delay)
- Payment processing is mocked
- All monetary values use USD by default
