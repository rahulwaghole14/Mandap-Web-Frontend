# Event Gallery API Documentation

## Overview

This document provides comprehensive API documentation for implementing the Event Gallery system. The gallery system allows unlimited image uploads per event with advanced features like drag-and-drop reordering, featured images, and image management.

## Database Schema

### Gallery Table

```sql
CREATE TABLE gallery (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL, -- 'event', 'member', 'association', 'vendor'
  entity_id INTEGER NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  caption TEXT,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_gallery_entity ON gallery(entity_type, entity_id);
CREATE INDEX idx_gallery_order ON gallery(entity_type, entity_id, display_order);
CREATE INDEX idx_gallery_active ON gallery(is_active);
```

## API Endpoints

### 1. Get Gallery Images

**Endpoint:** `GET /api/gallery/:entityType/:entityId`

**Description:** Retrieve gallery images for a specific entity with pagination support.

**Parameters:**
- `entityType` (string, required): Type of entity ('event', 'member', 'association', 'vendor')
- `entityId` (integer, required): ID of the entity

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Number of images per page (default: 20)
- `featured` (boolean, optional): Filter for featured images only

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": 1,
      "entityType": "event",
      "entityId": 123,
      "filename": "image-1758025125377-823569949.png",
      "originalName": "event-photo.jpg",
      "caption": "Event setup",
      "altText": "Event venue setup",
      "displayOrder": 1,
      "isActive": true,
      "isFeatured": true,
      "fileSize": 1024000,
      "mimeType": "image/jpeg",
      "uploadedBy": 1,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "uploadedByUser": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalImages": 45,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid entity type"
}
```

### 2. Upload Gallery Images

**Endpoint:** `POST /api/gallery/:entityType/:entityId`

**Description:** Upload multiple images to an entity's gallery.

**Parameters:**
- `entityType` (string, required): Type of entity ('event', 'member', 'association', 'vendor')
- `entityId` (integer, required): ID of the entity

**Request Body:** `multipart/form-data`
- `images` (file[], required): Array of image files (max 10 files, 10MB each)
- `captions` (string[], optional): Array of captions for each image
- `altTexts` (string[], optional): Array of alt texts for each image

**File Validation:**
- Allowed types: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- Max file size: 10MB per file
- Max files per request: 10

**Response:**
```json
{
  "success": true,
  "message": "3 images uploaded successfully",
  "images": [
    {
      "id": 1,
      "entityType": "event",
      "entityId": 123,
      "filename": "image-1758025125377-823569949.png",
      "originalName": "event-photo1.jpg",
      "caption": "Event setup",
      "altText": "Event venue setup",
      "displayOrder": 1,
      "isActive": true,
      "isFeatured": false,
      "fileSize": 1024000,
      "mimeType": "image/jpeg",
      "uploadedBy": 1,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "No images provided"
}
```

### 3. Update Gallery Image

**Endpoint:** `PUT /api/gallery/:id`

**Description:** Update image details (caption, alt text, display order, featured status).

**Parameters:**
- `id` (integer, required): Gallery image ID

**Request Body:**
```json
{
  "caption": "Updated caption",
  "altText": "Updated alt text",
  "displayOrder": 2,
  "isFeatured": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image updated successfully",
  "image": {
    "id": 1,
    "entityType": "event",
    "entityId": 123,
    "filename": "image-1758025125377-823569949.png",
    "originalName": "event-photo.jpg",
    "caption": "Updated caption",
    "altText": "Updated alt text",
    "displayOrder": 2,
    "isActive": true,
    "isFeatured": true,
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "uploadedBy": 1,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z",
    "uploadedByUser": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Image not found"
}
```

### 4. Delete Gallery Image

**Endpoint:** `DELETE /api/gallery/:id`

**Description:** Delete a gallery image and its associated file.

**Parameters:**
- `id` (integer, required): Gallery image ID

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Image not found"
}
```

### 5. Reorder Gallery Images

**Endpoint:** `PUT /api/gallery/:entityType/:entityId/reorder`

**Description:** Reorder images in the gallery by providing new order.

**Parameters:**
- `entityType` (string, required): Type of entity
- `entityId` (integer, required): ID of the entity

**Request Body:**
```json
{
  "imageIds": [3, 1, 2, 4]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Images reordered successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "imageIds must be an array"
}
```

### 6. Get Gallery Statistics

**Endpoint:** `GET /api/gallery/:entityType/:entityId/stats`

**Description:** Get statistics about the gallery (total images, total size, average size).

**Parameters:**
- `entityType` (string, required): Type of entity
- `entityId` (integer, required): ID of the entity

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalImages": 15,
    "totalSize": 52428800,
    "averageSize": 3495253
  }
}
```

## Implementation Notes

### File Upload Configuration

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files at once
  },
  fileFilter: fileFilter
});
```

### Featured Image Logic

When setting an image as featured (`isFeatured: true`):
1. Set the specified image as featured
2. Unfeature all other images of the same entity
3. Only one image can be featured per entity

### Display Order Logic

- Images are ordered by `displayOrder` (ascending)
- Featured images appear first (ordered by `isFeatured DESC`)
- New images get the next available order number
- Reordering updates all affected images

### CORS Configuration

Ensure proper CORS headers for image serving:

```javascript
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Vary', 'Origin');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}, express.static(uploadsPath));
```

## Error Handling

### Common Error Codes

- `400 Bad Request`: Invalid parameters, file validation errors
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Image or entity not found
- `413 Payload Too Large`: File size exceeds limit
- `415 Unsupported Media Type`: Invalid file type
- `500 Internal Server Error`: Server errors

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

## Security Considerations

1. **Authentication**: All upload/delete/update operations require authentication
2. **File Validation**: Strict file type and size validation
3. **Path Traversal**: Prevent directory traversal attacks
4. **Rate Limiting**: Implement rate limiting for upload endpoints
5. **File Cleanup**: Delete orphaned files when database records are removed

## Performance Optimization

1. **Database Indexes**: Proper indexing on frequently queried fields
2. **Pagination**: Implement pagination for large galleries
3. **File Compression**: Consider image compression for storage
4. **CDN Integration**: Use CDN for image delivery
5. **Caching**: Implement caching for frequently accessed images

## Testing

### Test Cases

1. **Upload Tests**:
   - Valid image uploads
   - Invalid file types
   - File size limits
   - Multiple file uploads
   - Caption and alt text handling

2. **CRUD Tests**:
   - Create, read, update, delete operations
   - Featured image logic
   - Display order updates
   - Pagination

3. **Error Handling Tests**:
   - Invalid entity types
   - Non-existent entities
   - Permission checks
   - File system errors

### Sample Test Data

```json
{
  "testImages": [
    {
      "filename": "test-image-1.jpg",
      "caption": "Test image 1",
      "altText": "Test alt text 1",
      "isFeatured": true
    },
    {
      "filename": "test-image-2.png",
      "caption": "Test image 2",
      "altText": "Test alt text 2",
      "isFeatured": false
    }
  ]
}
```

## Deployment Checklist

- [ ] Create gallery table with proper indexes
- [ ] Configure file upload directory permissions
- [ ] Set up CORS headers for image serving
- [ ] Implement authentication middleware
- [ ] Add rate limiting for upload endpoints
- [ ] Configure file size and type validation
- [ ] Test all endpoints with sample data
- [ ] Set up error logging and monitoring
- [ ] Configure backup strategy for uploaded files

## Support

For questions or issues with the gallery API implementation, please refer to:
- Database schema documentation
- File upload best practices
- CORS configuration guide
- Error handling patterns

---

**Note**: This API is designed to be extensible for other entity types (members, associations, vendors) by using the `entityType` and `entityId` parameters.
