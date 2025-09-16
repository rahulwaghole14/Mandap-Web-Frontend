# Event Gallery System

## Overview

I've implemented a comprehensive gallery system for your Mandap Association Platform that allows unlimited image uploads per event, with advanced features like drag-and-drop reordering, featured images, and image management.

## 🎯 Why Separate Gallery System?

**Instead of limiting to 10 images in the event form, I created a separate gallery system because:**

1. **Better UX**: Event creation form stays clean and focused
2. **Unlimited Images**: No arbitrary limits on gallery size
3. **Advanced Features**: Drag-and-drop reordering, featured images, captions
4. **Reusability**: Can be used for members, associations, vendors too
5. **Performance**: Lazy loading and pagination for large galleries
6. **Organization**: Images can be categorized and managed independently

## 🏗️ Architecture

### Backend Components

1. **Gallery Model** (`mandap-backend/models/Gallery.js`)
   - Supports multiple entity types (event, member, association, vendor)
   - Features: captions, alt text, display order, featured images
   - File metadata: size, MIME type, original filename

2. **Gallery API Routes** (`mandap-backend/routes/galleryRoutes.js`)
   - `GET /api/gallery/:entityType/:entityId` - Get gallery images
   - `POST /api/gallery/:entityType/:entityId` - Upload multiple images
   - `PUT /api/gallery/:id` - Update image details
   - `DELETE /api/gallery/:id` - Delete image
   - `PUT /api/gallery/:entityType/:entityId/reorder` - Reorder images
   - `GET /api/gallery/:entityType/:entityId/stats` - Get gallery statistics

3. **Database Migration** (`mandap-backend/scripts/create-gallery-table.js`)
   - Creates the gallery table with proper indexes

### Frontend Components

1. **Gallery API Service** (`src/services/galleryApi.js`)
   - Handles all gallery API calls
   - File validation and formatting utilities

2. **EventGallery Component** (`src/components/EventGallery.jsx`)
   - Full-featured gallery management interface
   - Drag-and-drop reordering
   - Featured image management
   - Image viewer with captions
   - Bulk upload with captions

3. **Events Integration** (`src/pages/Events.jsx`)
   - Added gallery button to each event card
   - Integrated EventGallery component

## 🚀 Features

### Image Management
- ✅ **Unlimited Uploads**: No limit on number of images per event
- ✅ **Multiple File Upload**: Upload up to 10 images at once
- ✅ **File Validation**: 10MB limit per file, image type validation
- ✅ **Drag & Drop Reordering**: Visual reordering of images
- ✅ **Featured Images**: Mark one image as featured per event
- ✅ **Captions & Alt Text**: Add descriptions for accessibility

### User Experience
- ✅ **Image Viewer**: Full-screen image viewing with captions
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Loading States**: Proper loading indicators
- ✅ **Error Handling**: Comprehensive error messages
- ✅ **File Size Display**: Shows file sizes in human-readable format

### Performance
- ✅ **Pagination**: Load images in batches (20 per page)
- ✅ **Lazy Loading**: Images load as needed
- ✅ **CORS Support**: Proper cross-origin image loading
- ✅ **Caching**: Browser caching for better performance

## 📋 Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd mandap-backend

# Create the gallery table
node scripts/create-gallery-table.js

# Restart your server
npm start
```

### 2. Frontend Setup

The frontend components are already integrated. No additional setup required.

### 3. Usage

1. **Create an Event**: Use the existing event creation form (keeps the main image field for the featured image)
2. **Manage Gallery**: Click the purple gallery icon (🖼️) on any event card
3. **Upload Images**: Use the "Add Images" button to upload multiple images
4. **Organize**: Drag and drop images to reorder them
5. **Feature**: Click the star icon to mark an image as featured
6. **View**: Click the eye icon to view images in full screen

## 🔧 API Endpoints

### Get Gallery Images
```http
GET /api/gallery/event/123?page=1&limit=20&featured=true
```

### Upload Images
```http
POST /api/gallery/event/123
Content-Type: multipart/form-data

images: [file1, file2, file3]
captions: ["Caption 1", "Caption 2", "Caption 3"]
altTexts: ["Alt 1", "Alt 2", "Alt 3"]
```

### Update Image
```http
PUT /api/gallery/456
{
  "caption": "New caption",
  "altText": "New alt text",
  "isFeatured": true
}
```

### Delete Image
```http
DELETE /api/gallery/456
```

### Reorder Images
```http
PUT /api/gallery/event/123/reorder
{
  "imageIds": [456, 789, 123]
}
```

## 🎨 UI Components

### Event Card Integration
- Added purple gallery icon (🖼️) to each event card
- Click to open the gallery management interface

### Gallery Interface
- **Grid Layout**: Responsive grid showing all images
- **Upload Modal**: Drag-and-drop file upload with captions
- **Image Viewer**: Full-screen viewing with navigation
- **Action Buttons**: View, feature, delete for each image

## 🔒 Security Features

- **Authentication Required**: All upload/delete operations require login
- **File Validation**: Only image files allowed, size limits enforced
- **CORS Protection**: Proper CORS headers for image serving
- **Input Sanitization**: All user inputs are validated

## 📊 Database Schema

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

## 🚀 Future Enhancements

The gallery system is designed to be extensible. You can easily add:

1. **Image Categories**: Group images by type (venue, food, activities)
2. **Image Tags**: Add tags for better organization
3. **Bulk Operations**: Select multiple images for bulk actions
4. **Image Editing**: Basic crop/resize functionality
5. **Video Support**: Extend to support video files
6. **Public Galleries**: Make galleries publicly viewable
7. **Download Options**: Allow users to download images

## 🎯 Benefits

1. **Scalable**: Can handle hundreds of images per event
2. **User-Friendly**: Intuitive drag-and-drop interface
3. **Accessible**: Proper alt text and captions support
4. **Mobile-Ready**: Responsive design works on all devices
5. **Performance-Optimized**: Pagination and lazy loading
6. **Extensible**: Easy to add new features and entity types

The gallery system is now ready to use! Your events can have unlimited images with professional gallery management capabilities.
