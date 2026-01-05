# Google OAuth Setup Instructions

## Setting Up Google OAuth for MOVE App

To enable Google Sign-In functionality, follow these steps:

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** for your project

### 2. Create OAuth 2.0 Credentials

#### For Android:
1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Select **Android** as application type
3. Get your SHA-1 certificate fingerprint:
   ```bash
   # For development
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For production
   keytool -list -v -keystore path/to/your/keystore -alias your-alias
   ```
4. Enter package name: `com.yourusername.moveapp` (from app.json)
5. Enter SHA-1 fingerprint
6. Copy the **Client ID**

#### For iOS:
1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Select **iOS** as application type
3. Enter Bundle ID from app.json (e.g., `com.yourusername.moveapp`)
4. Copy the **Client ID**

#### For Web (Expo):
1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Select **Web application** as application type
3. Add authorized redirect URIs:
   - `https://auth.expo.io/@your-expo-username/move-app`
4. Copy the **Client ID**

### 3. Update app.json

Add to your `app.json`:

```json
{
  "expo": {
    "scheme": "moveapp",
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.yourusername.moveapp"
    }
  }
}
```

### 4. Update login.tsx

In `app/login.tsx`, replace the placeholder Client IDs:

```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
});
```

Replace:
- `YOUR_WEB_CLIENT_ID` with your Web client ID
- `YOUR_IOS_CLIENT_ID` with your iOS client ID  
- `YOUR_ANDROID_CLIENT_ID` with your Android client ID

### 5. Test

Run your app:
```bash
npx expo start
```

Click "Sign in with Google" and verify the OAuth flow works correctly.

### Troubleshooting

- **"Developer Error" on Android**: Check SHA-1 fingerprint matches
- **"Invalid Client" error**: Verify Client IDs are correct
- **Redirect URI mismatch**: Ensure redirect URIs in Google Console match Expo's auth URLs

### Backend Setup

The backend endpoint is already configured at:
```
POST http://192.168.1.31:8000/api/corporate/customer/google-auth/
```

It accepts:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "google_id": "123456789",
  "picture": "https://..."
}
```

And returns:
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "token": "abc123..."
}
```
