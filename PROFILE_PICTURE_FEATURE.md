# Profile Picture Upload Feature

## Overview
Users can now upload and manage their profile pictures in the Move app. Profile pictures are stored on the backend and displayed throughout the app.

## Backend Implementation

### Database Model
- **File**: `move_backend/corporate/models.py`
- **Model**: `Customer`
- **New Field**: `profile_picture = models.ImageField(upload_to='customer_profiles/', blank=True, null=True)`

### API Endpoints

#### 1. Upload/Update Profile Picture
- **URL**: `/api/corporate/customer/<customer_id>/profile-picture/`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `profile_picture`: Image file (JPEG, PNG, etc.)
- **Response**:
  ```json
  {
    "message": "Profile picture uploaded successfully",
    "profile_picture": "http://192.168.1.31:8000/media/customer_profiles/image.jpg"
  }
  ```

#### 2. Delete Profile Picture
- **URL**: `/api/corporate/customer/<customer_id>/profile-picture/`
- **Method**: `DELETE`
- **Response**:
  ```json
  {
    "message": "Profile picture deleted successfully"
  }
  ```

#### 3. Get Customer Profile
- **URL**: `/api/corporate/customer/<customer_id>/profile/`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+256700000000",
    "profile_picture": "http://192.168.1.31:8000/media/customer_profiles/image.jpg",
    "date_joined": "2025-01-01T00:00:00Z"
  }
  ```

#### 4. Update Profile Information
- **URL**: `/api/corporate/customer/<customer_id>/profile/`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "full_name": "John Doe Updated",
    "phone": "+256700000001"
  }
  ```

### Updated Authentication Responses
All authentication endpoints now include `profile_picture` in their responses:

- **Customer Login** (`/api/corporate/customer/login/`)
- **Customer Register** (`/api/corporate/customer/register/`)
- **Google Auth** (`/api/corporate/customer/google-auth/`)

Response format:
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "profile_picture": "http://192.168.1.31:8000/media/customer_profiles/image.jpg",
  "token": "abc123..."
}
```

### Media Storage
- **Directory**: `move_backend/media/customer_profiles/`
- **URL Path**: `/media/customer_profiles/<filename>`
- **Full URL**: `http://192.168.1.31:8000/media/customer_profiles/<filename>`

## Frontend Implementation

### Account Screen
- **File**: `move_app/screens/AccountScreen.tsx`
- **Features**:
  - Display current profile picture or initials fallback
  - Camera icon overlay to indicate upload capability
  - Tap avatar to open image picker
  - Permission request for photo library access
  - Loading indicator during upload
  - Success/error alerts
  - Automatic profile picture refresh on load

### Home Screen
- **File**: `move_app/screens/HomeScreen.tsx`
- **Features**:
  - Display profile picture in header avatar
  - Fallback to initials if no picture
  - Tap avatar to navigate to account screen
  - Automatic profile picture loading on mount

### Image Picker Configuration
- **Library**: `expo-image-picker`
- **Settings**:
  - Media type: Images only
  - Editing: Enabled with 1:1 aspect ratio
  - Quality: 0.7 (70% compression)
  - Format: Maintained from original

## User Flow

1. **Upload Profile Picture**:
   - User navigates to Account screen
   - Taps on avatar/camera icon
   - System requests photo library permission (first time only)
   - User selects image from library
   - Image is cropped to 1:1 square
   - Image is uploaded to backend
   - Success message is displayed
   - Profile picture updates throughout app

2. **View Profile Picture**:
   - Profile picture automatically loads when:
     - Account screen opens
     - Home screen opens
     - User logs in
   - Falls back to initials if no picture exists

3. **Update Profile Picture**:
   - Same as upload flow
   - Old profile picture is automatically deleted from server
   - New picture replaces it

## Technical Details

### Image Upload Format
```typescript
const formData = new FormData();
formData.append('profile_picture', {
  uri: imageUri,
  name: filename,
  type: 'image/jpeg', // or detected mime type
} as any);
```

### API Request Headers
```typescript
headers: {
  'Content-Type': 'multipart/form-data',
}
```

### Profile Picture URL Handling
Backend returns absolute URLs:
- With picture: `"http://192.168.1.31:8000/media/customer_profiles/image_abc123.jpg"`
- Without picture: `null`

Frontend displays:
```tsx
{profilePicture ? (
  <Image source={{ uri: profilePicture }} style={styles.avatar} />
) : (
  <Text>{userInitials}</Text>
)}
```

## Database Migration
- **Migration File**: `corporate/migrations/0009_customer_profile_picture.py`
- **Applied**: ✅ Successfully applied
- **Changes**: Added `profile_picture` field to Customer model

## Security Considerations
1. File size limits handled by Django settings
2. File type validation via ImageField
3. Old pictures automatically deleted on update
4. No authentication required for upload (user provides customer_id)
   - Note: Consider adding token authentication in production

## Testing

### Backend Testing
```bash
# Test upload
curl -X POST \
  http://192.168.1.31:8000/api/corporate/customer/1/profile-picture/ \
  -F "profile_picture=@/path/to/image.jpg"

# Test get profile
curl http://192.168.1.31:8000/api/corporate/customer/1/profile/

# Test delete
curl -X DELETE \
  http://192.168.1.31:8000/api/corporate/customer/1/profile-picture/
```

### Frontend Testing
1. Open Account screen
2. Tap avatar
3. Select image
4. Verify upload success
5. Navigate to Home screen
6. Verify profile picture displays
7. Return to Account screen
8. Upload different image
9. Verify old image replaced

## Future Enhancements
- [ ] Add image compression on backend
- [ ] Support multiple image formats
- [ ] Add image cropping in-app
- [ ] Cache profile pictures locally
- [ ] Add profile picture to ride history
- [ ] Show profile pictures in driver app
- [ ] Add default avatars to choose from
- [ ] Support profile picture removal (set to null)
- [ ] Add file size and dimension validation
- [ ] Add token authentication to upload endpoint
