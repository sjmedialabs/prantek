# Profile Image Upload - Implementation Guide

## Changes Made

### 1. **MongoDB GridFS Storage**
- Created `/lib/gridfs-storage.ts` - Utility functions for storing files in MongoDB GridFS
- Files are now stored in MongoDB Atlas instead of local filesystem
- This ensures images persist across deployments and server restarts

### 2. **Upload API Updates**
- Updated `/app/api/upload/route.ts` to use GridFS
- Images are uploaded to MongoDB and return a URL like `/api/files/{fileId}`

### 3. **File Serving Endpoint**
- Created `/app/api/files/[id]/route.ts` to serve files from GridFS
- Handles image retrieval with proper content-type headers
- Supports caching for better performance

### 4. **User Model Updates**
- Added `avatar`, `phone`, and `address` fields to User interface in `/lib/models/types.ts`
- Updated user context in `/components/auth/user-context.tsx`

### 5. **Profile Page Redesign**
- Combined Profile Overview and Account Information sections
- Added inline edit functionality with Save/Cancel buttons
- Profile picture upload with preview
- All user data (name, email, phone, address, avatar) editable in one place

### 6. **Global Avatar Display**
- **Sidebar**: Shows avatar in left navigation
- **Header**: Shows avatar in top header dropdown
- **Profile Page**: Shows avatar with edit capability

## How It Works

### Upload Flow:
1. User selects an image file
2. File is sent to `/api/upload`
3. File is stored in MongoDB GridFS
4. Returns URL: `/api/files/{fileId}`
5. URL is saved to user's `avatar` field in database

### Display Flow:
1. User avatar URL is stored in MongoDB user document
2. URL points to `/api/files/{fileId}`
3. When image is requested, `/api/files/[id]/route.ts` fetches from GridFS
4. Image is served with proper headers

## Testing Steps

### 1. Upload Profile Picture:
```
1. Navigate to /dashboard/profile
2. Click "Edit Profile"
3. Upload an image (max 2MB)
4. Click "Save"
5. Page will reload
6. Avatar should appear in:
   - Profile overview
   - Left sidebar
   - Top header
```

### 2. Check Browser Console:
Look for these logs:
```
[Upload] Upload API called
[Upload] File received: {name, size, type}
[GridFS] File uploaded successfully: {fileId, filename}
[Profile] Saving profile data: {avatar: "/api/files/..."}
[Profile] Save result: {...}
```

### 3. Check MongoDB:
```
- Collection: users
- Find your user document
- Check `avatar` field should have value like "/api/files/507f1f77bcf86cd799439011"
- Collection: uploads.files (GridFS metadata)
- Collection: uploads.chunks (GridFS file chunks)
```

## Troubleshooting

### Image Not Showing After Upload:
1. Check browser console for errors
2. Check server logs for upload errors
3. Verify MongoDB connection
4. Check if file was saved to GridFS

### 404 on Image URL:
1. Verify file ID in URL matches GridFS
2. Check `/api/files/[id]/route.ts` is working
3. Test URL directly: `http://localhost:3000/api/files/{fileId}`

### Image Upload Fails:
1. Check file size (max 2MB)
2. Check file type (only images allowed)
3. Check MongoDB connection
4. Check GridFS bucket creation

## API Endpoints

### POST `/api/upload`
Uploads file to GridFS
```json
Response: {
  "url": "/api/files/507f1f77bcf86cd799439011",
  "fileId": "507f1f77bcf86cd799439011",
  "filename": "avatar.jpg",
  "size": 12345,
  "type": "image/jpeg"
}
```

### GET `/api/files/[id]`
Serves file from GridFS
```
Returns: Binary image data with proper Content-Type header
```

### PUT `/api/users/[id]`
Updates user profile
```json
Request: {
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 12345 67890",
  "address": "123 Main St",
  "avatar": "/api/files/507f1f77bcf86cd799439011"
}
```

## Environment Variables

Ensure MongoDB connection string is set:
```env
MONGODB_URI=mongodb+srv://...
```

## Benefits of GridFS

1. **Persistent Storage**: Files stored in MongoDB Atlas cloud
2. **Scalable**: Handles large files (>16MB chunks)
3. **Backup**: Included in MongoDB backups
4. **CDN Ready**: Can be fronted with CDN for performance
5. **No Filesystem**: Works in serverless environments

## Future Enhancements

1. **Image Optimization**: Resize/compress images before upload
2. **CDN Integration**: Use Cloudinary or AWS S3 for better performance
3. **Multiple Images**: Support for cover photos, galleries
4. **Image Cropping**: Client-side cropping before upload
5. **Progressive Upload**: Show upload progress
