# Ride Features Implementation Guide

## Features Implemented

### 1. Email Receipt After Ride Completion
Customers automatically receive an email receipt when their ride is completed.

**Backend Changes:**
- Added `receipt_sent`, `receipt_sent_at`, and `completed_at` fields to Booking model
- Created `send_booking_receipt()` function to generate and send formatted email receipts
- Added `CompleteBookingAPIView` endpoint to complete rides and trigger receipt emails

**API Endpoint:**
```
PATCH /api/corporate/bookings/{booking_id}/complete/
```

**Email Template Includes:**
- Booking ID and date
- Ride type, pickup/destination
- Distance and duration
- Payment method and amount
- Driver name

### 2. Nearest Driver Assignment
Automatically assigns the closest available driver to a booking request.

**Backend Changes:**
- Added location tracking fields to Driver model: `current_latitude`, `current_longitude`, `location_updated_at`
- Added pickup/destination coordinates to Booking model
- Implemented `calculate_distance()` using Haversine formula
- Created `AssignNearestDriverAPIView` to find and assign nearest driver
- Added `UpdateDriverLocationAPIView` for drivers to update their location

**API Endpoints:**

**Assign Nearest Driver:**
```
POST /api/corporate/bookings/{booking_id}/assign-driver/
```

**Update Driver Location:**
```
PATCH /api/corporate/driver/{driver_id}/location/
Body: {
  "latitude": 6.5244,
  "longitude": 3.3792
}
```

## How to Use

### Send Receipt After Ride
```javascript
const completeRide = async (bookingId) => {
  const response = await fetch(
    `http://192.168.1.31:8000/api/corporate/bookings/${bookingId}/complete/`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    }
  );
  
  const data = await response.json();
  console.log(data.receipt_sent); // true if email sent successfully
};
```

### Assign Nearest Driver to Booking
```javascript
const assignDriver = async (bookingId) => {
  const response = await fetch(
    `http://192.168.1.31:8000/api/corporate/bookings/${bookingId}/assign-driver/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }
  );
  
  const data = await response.json();
  // Returns: driver_id, driver_name, driver_phone, distance
};
```

### Update Driver Location (for Driver App)
```javascript
const updateLocation = async (driverId, latitude, longitude) => {
  await fetch(
    `http://192.168.1.31:8000/api/corporate/driver/${driverId}/location/`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude })
    }
  );
};
```

## Complete Booking Flow

1. **Customer creates booking** with pickup/destination coordinates
   ```
   POST /api/corporate/bookings/
   ```

2. **System finds nearest driver**
   ```
   POST /api/corporate/bookings/{booking_id}/assign-driver/
   ```

3. **Driver accepts and completes ride**
   - Status updates: `pending` → `driver_assigned` → `picked_up` → `completed`

4. **System marks ride complete and sends receipt**
   ```
   PATCH /api/corporate/bookings/{booking_id}/complete/
   ```

5. **Customer receives email receipt automatically**

## Updated Booking Status Flow

- `pending` - Initial state
- `searching_driver` - Looking for available driver
- `driver_assigned` - Driver found and assigned
- `driver_arrived` - Driver at pickup location
- `picked_up` - Customer in vehicle
- `completed` - Ride finished (triggers receipt email)
- `cancelled` - Booking cancelled

## Email Configuration

Email settings are already configured in `settings.py`:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'mail.solichsystems.com'
EMAIL_USE_SSL = True
DEFAULT_FROM_EMAIL = 'SOLICH <info@solichsystems.com>'
```

## Database Changes Applied

Migration `0008` added:
- Booking: `completed_at`, `receipt_sent`, `receipt_sent_at`, coordinates fields
- Driver: `current_latitude`, `current_longitude`, `location_updated_at`

All migrations have been successfully applied to the database.
