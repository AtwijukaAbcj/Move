# Move Driver App

A complete React Native driver application built with Expo for the Move transportation platform.

## Features

### 🔐 Authentication
- Driver registration with OTP verification (phone/email)
- Secure login with credentials
- OTP verification with resend functionality
- Session management with secure storage

### 📊 Dashboard
- Real-time driver status (approved/pending)
- Online/offline toggle
- Today's earnings and trips counter
- Online time tracker
- **Interactive map showing nearby ride requests**
- Visual markers for driver location and pickup points
- Incoming ride requests with auto-polling
- Accept ride and automatically open navigation
- Reject ride requests
- Quick access to all driver tools via bottom tabs

### 📄 Document Management
- Upload driver's license
- Upload car ownership documents
- Upload car images (2 photos)
- Upload inspection reports
- View upload status for all documents

### 💰 Earnings
- View earnings by period (today, week, month, total)
- Interactive period selector
- Detailed earnings breakdown
- Visual stats cards

### 🚗 Trip History
- View all completed trips
- Pickup and destination details
- Trip fare and duration
- Trip status badges

### 💳 Wallet
- View available balance
- Track pending payments
- Transaction history
- Request payout functionality
- Payout information and schedules

### 👤 Profile Management
- View and edit driver information
- Update name, phone, email, vehicle type
- View verification status
- Member since date
- Quick actions (documents, support, logout)

### 💬 Support
- Multiple contact options (call, chat, email)
- Support topic selection
- Submit support requests
- FAQ section with common questions

## Tech Stack

- **Framework**: React Native with Expo (~54.0.30)
- **Navigation**: React Navigation 7.x
  - Native Stack Navigator
  - Bottom Tabs Navigator
- **Maps**: React Native Maps with Google Maps provider
- **UI Components**: React Native core components
- **Icons**: @expo/vector-icons (Ionicons)
- **Storage**: expo-secure-store for token management
- **Document Picker**: expo-document-picker

## Project Structure

```
Move-driver-app/
├── screens/
│   ├── DashboardScreen.js          # Main driver dashboard
│   ├── LoginScreen.js              # Driver login
│   ├── DriverRegistrationScreen.js # Driver registration
│   ├── OtpVerificationScreen.js    # OTP verification
│   ├── DocumentUploadScreen.js     # Document uploads
│   ├── EarningsScreen.js           # Earnings tracking
│   ├── TripHistoryScreen.js        # Trip history
│   ├── WalletScreen.js             # Wallet & payouts
│   ├── ProfileScreen.js            # Driver profile
│   └── SupportScreen.js            # Support center
├── navigation/
│   └── DriverTabs.js               # Bottom tab navigation
├── utils/
│   └── storage.js                  # Secure storage utilities
├── App.tsx                         # Main app component
└── package.json

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or Expo Go app)

### Installation

1. **Clone the repository**
   ```bash
   cd Move-driver-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Base URL**
   Update the API_BASE constant in all screen files to match your backend URL:
   ```javascript
   const API_BASE = "http://YOUR_BACKEND_IP:8000";
   ```

4. **Configure Google Maps (for map features)**
   
   For iOS, add to app.json:
   ```json
   {
6    "ios": {
       "config": {
         "googleMapsApiKey": "YOUR_IOS_API_KEY"
       }
     }
   }
   ```
   
   For Android, add to app.json:
   ```json
   {
     "android": {
       "config": {
         "googleMaps": {
           "apiKey": "YOUR_ANDROID_API_KEY"
         }
       }
     }
   }
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## API Endpoints

The app connects to the following backend endpoints:

### Authentication
- `POST /api/corporate/driver/register/` - Register new driver
- `POST /api/corporate/driver/login/` - Driver login
- `POST /api/corporate/driver/verify-otp/` - Verify OTP
- `POST /api/corporate/driver/resend-otp/` - Resend OTP

### Driver Management
- `GET /api/corporate/driver/{id}/status/` - Get driver status
- `PATCH /api/corporate/driver/{id}/set-online/` - Toggle online status
- `GET /api/corporate/driver/{id}/profile/` - Get driver profile
- `PATCH /api/corporate/driver/{id}/profile/` - Update profile

### Document Upload
- `POST /api/corporate/driver/upload-document/` - Upload documents

### Rides
- `GET /api/corporate/driver/{id}/ride-requests/` - Get pending ride requests
- `POST /api/corporate/driver/{id}/accept-ride/` - Accept ride request
- `POST /api/corporate/driver/{id}/reject-ride/` - Reject ride request

### Earnings & Wallet
- `GET /api/corporate/driver/{id}/earnings/` - Get earnings summary
- `GET /api/corporate/driver/{id}/trips/` - Get trip history
- `GET /api/corporate/driver/{id}/wallet/` - Get wallet info

## Key Features Explained

### Interactive Map View
The dashboard includes a real-time map that displays:
- **Driver's current location** (teal marker)
- **Pickup locations** for incoming ride requests (blue markers)
- Map only appears when driver is online
- Tap markers to see request details
- Automatically fits all markers in view

When a driver accepts a ride request, the app automatically opens Google Maps with turn-by-turn navigation to the pickup location.

### Real-time Ride Polling
The dashboard automatically polls for new ride requests every 5 seconds when the driver is online and approved. This ensures drivers receive requests immediately.

### Secure Token Storage
All authentication tokens and user IDs are stored securely using `expo-secure-store`, ensuring sensitive data is protected.

### Document Upload Flow
1. Driver registers and logs in
2. System prompts for document upload
3. Driver uploads all required documents
4. Admin reviews and approves
5. Driver can go online and receive requests

### Online Status Management
- Drivers can toggle online/offline status
- Online time is tracked locally in real-time
- Status syncs with backend for ride matching

## Styling

The app uses a custom dark theme with the following color scheme:
- **Primary**: #2f66ff (Blue)
- **Accent**: #5EC6C6 (Teal)
- **Background**: #0b1220 (Dark Navy)
- **Card Background**: #121b2e
- **Text**: #fff (White)
- **Secondary Text**: #aeb9cc

All screens follow a consistent design language with rounded cards, proper spacing, and visual hierarchy.

## Development Tips

1. **Testing OTP Flow**: Check the Django console for OTP codes during development
2. **API Testing**: Use the Django admin panel to manually approve drivers
3. **Hot Reload**: Expo provides fast refresh - save files to see changes instantly
4. **Debugging**: Use React Native Debugger or console.log statements

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

### EAS Build (Recommended)
```bash
eas build --platform ios
eas build --platform android
```

## Known Limitations

1. **Mock Data**: Some features (earnings, trip history) currently return mock data until backend models are implemented
2. **Push Notifications**: Not yet implemented - ride requests use polling
3. **Maps Integration**: Not included in current version
4. **Real-time Chat**: Support chat is a placeholder

## Future Enhancements

- [ ] Push notifications for ride requests
- [ ] Real-time location tracking
- [ ] In-app navigation to pickup/destination
- [ ] Live support chat
- [ ] Rating system
- [ ] Photo upload for profile
- [ ] Multi-language support
- [ ] Offline mode capabilities

## Troubleshooting

### Login Issues
- Verify backend is running and accessible
- Check API_BASE URL is correct
- Ensure driver is OTP verified in database

### Document Upload Fails
- Check file size (max 10MB recommended)
- Verify backend media settings
- Ensure proper file permissions

### Connection Errors
- Verify device and backend are on same network (for local testing)
- Check firewall settings
- Enable CORS in backend if needed

## License

Proprietary - Move Transportation Platform

## Support

For technical support or questions:
- Email: support@moveapp.com
- In-app support center
- Admin dashboard for driver assistance

---

Built with ❤️ using React Native and Expo
