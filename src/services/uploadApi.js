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

export const uploadApi = {
  // Upload image file (for events)
  uploadImage: async (file) => {
    try {
      console.log('UploadApi - Uploading image:', file.name);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const authInstance = createAuthInstance();
      const response = await authInstance.post('/upload/event-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('UploadApi - Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UploadApi - Upload error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Upload failed');
      }
      throw new Error('Network error during upload');
    }
  },

  // Upload profile image file
  uploadProfileImage: async (file) => {
    try {
      console.log('UploadApi - Uploading profile image:', file.name);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const authInstance = createAuthInstance();
      const response = await authInstance.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('UploadApi - Profile upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UploadApi - Profile upload error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Upload failed');
      }
      throw new Error('Network error during upload');
    }
  },

  // Delete uploaded file
  deleteImage: async (filename) => {
    try {
      console.log('UploadApi - Deleting image:', filename);
      const authInstance = createAuthInstance();
      const response = await authInstance.delete(`/upload/${filename}`);
      console.log('UploadApi - Delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UploadApi - Delete error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Delete failed');
      }
      throw new Error('Network error during delete');
    }
  },

  // Get full image URL with CORS fallback
  getImageUrl: (filename) => {
    if (!filename) return null;
    // If it's already a full URL, return as is
    if (filename.startsWith('http')) return filename;
    // Remove /api from the base URL for image serving
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/uploads/event-images/${filename}`;
  },

  // Get image URL with CORS proxy fallback
  getImageUrlWithFallback: (filename) => {
    if (!filename) return null;
    // If it's already a full URL, return as is
    if (filename.startsWith('http')) return filename;
    
    // Remove /api from the base URL for image serving
    const baseUrl = API_BASE_URL.replace('/api', '');
    const directUrl = `${baseUrl}/uploads/event-images/${filename}`;
    
    // For development, you can use a CORS proxy if needed
    // const proxyUrl = `https://cors-anywhere.herokuapp.com/${directUrl}`;
    
    return directUrl;
  },

  // Check if image URL is accessible (for debugging CORS issues)
  checkImageAccess: async (filename) => {
    try {
      const url = uploadApi.getImageUrl(filename);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Image access check failed:', error);
      return false;
    }
  },

  // Alternative: Convert image to base64 for immediate display (temporary workaround)
  convertToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
};
