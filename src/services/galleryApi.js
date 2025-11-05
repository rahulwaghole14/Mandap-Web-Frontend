import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { uploadApi } from './uploadApi';

// Create axios instance with auth token
const createAuthInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
};

export const galleryApi = {
  // Get gallery images for an entity
  getGalleryImages: async (entityType, entityId, options = {}) => {
    try {
      const { page = 1, limit = 20, featured } = options;
      const params = new URLSearchParams();
      
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (featured !== undefined) params.append('featured', featured);

      const authInstance = createAuthInstance();
      const response = await authInstance.get(`/gallery/${entityType}/${entityId}?${params}`);
      
      return response.data;
    } catch (error) {
      console.error('GalleryApi - Get images error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch gallery images');
      }
      throw new Error('Network error while fetching gallery images');
    }
  },

  // Upload multiple images to gallery
  uploadGalleryImages: async (entityType, entityId, files, options = {}) => {
    try {
      const { captions = [], altTexts = [] } = options;
      
      // First, upload all files to Cloudinary (or backend if Cloudinary is not configured)
      console.log('GalleryApi - Uploading', files.length, 'images to Cloudinary');
      const uploadPromises = files.map(async (file, index) => {
        try {
          // Validate file before upload
          galleryApi.validateImageFile(file);
          
          // Upload to Cloudinary (or backend fallback)
          const uploadResult = await uploadApi.uploadImage(file);
          console.log(`GalleryApi - Image ${index + 1} uploaded:`, uploadResult);
          
          // Return Cloudinary URL (secure_url)
          return uploadResult.url || uploadResult.image || uploadResult.filename;
        } catch (error) {
          console.error(`GalleryApi - Failed to upload image ${index + 1}:`, error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }
      });
      
      // Wait for all uploads to complete
      const imageUrls = await Promise.all(uploadPromises);
      console.log('GalleryApi - All images uploaded. URLs:', imageUrls);
      
      // Check if we have any URLs
      if (!imageUrls || imageUrls.length === 0) {
        throw new Error('No images provided. Send images array with Cloudinary URLs.');
      }
      
      // Prepare payload with Cloudinary URLs
      const payload = {
        images: imageUrls, // Array of Cloudinary URLs
        captions: captions.length > 0 ? captions : undefined,
        altTexts: altTexts.length > 0 ? altTexts : undefined
      };
      
      // Remove undefined fields
      if (!payload.captions) delete payload.captions;
      if (!payload.altTexts) delete payload.altTexts;
      
      console.log('GalleryApi - Sending payload to backend:', payload);
      
      // Send JSON payload with Cloudinary URLs to backend
      const authInstance = createAuthInstance();
      const response = await authInstance.post(`/gallery/${entityType}/${entityId}`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('GalleryApi - Backend response:', response.data);
      return response.data;
    } catch (error) {
      console.error('GalleryApi - Upload images error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to upload images');
      }
      throw error; // Re-throw if it's already an Error with message
    }
  },

  // Update gallery image details
  updateGalleryImage: async (imageId, updateData) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.put(`/gallery/${imageId}`, updateData);
      
      return response.data;
    } catch (error) {
      console.error('GalleryApi - Update image error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to update image');
      }
      throw new Error('Network error while updating image');
    }
  },

  // Delete gallery image
  deleteGalleryImage: async (imageId) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.delete(`/gallery/${imageId}`);
      
      return response.data;
    } catch (error) {
      console.error('GalleryApi - Delete image error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to delete image');
      }
      throw new Error('Network error while deleting image');
    }
  },

  // Reorder gallery images
  reorderGalleryImages: async (entityType, entityId, imageIds) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.put(`/gallery/${entityType}/${entityId}/reorder`, {
        imageIds
      });
      
      return response.data;
    } catch (error) {
      console.error('GalleryApi - Reorder images error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to reorder images');
      }
      throw new Error('Network error while reordering images');
    }
  },

  // Get gallery statistics
  getGalleryStats: async (entityType, entityId) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get(`/gallery/${entityType}/${entityId}/stats`);
      
      return response.data;
    } catch (error) {
      console.error('GalleryApi - Get stats error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch gallery statistics');
      }
      throw new Error('Network error while fetching gallery statistics');
    }
  },

  // Get image URL - uses uploadApi for consistency
  getImageUrl: (filename) => {
    // Use the same logic as uploadApi.getImageUrl for consistency
    return uploadApi.getImageUrl(filename);
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Validate image file
  validateImageFile: (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }
    
    return true;
  }
};
