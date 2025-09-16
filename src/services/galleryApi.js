import axios from 'axios';
import { API_BASE_URL } from '../constants';

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
      
      const formData = new FormData();
      
      // Add files
      files.forEach(file => {
        formData.append('images', file);
      });
      
      // Add captions and alt texts if provided
      if (captions.length > 0) {
        formData.append('captions', JSON.stringify(captions));
      }
      if (altTexts.length > 0) {
        formData.append('altTexts', JSON.stringify(altTexts));
      }

      const authInstance = createAuthInstance();
      const response = await authInstance.post(`/gallery/${entityType}/${entityId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('GalleryApi - Upload images error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to upload images');
      }
      throw new Error('Network error while uploading images');
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

  // Get image URL
  getImageUrl: (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    return `${API_BASE_URL}/uploads/${filename}`;
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
