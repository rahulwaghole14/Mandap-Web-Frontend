import axios from 'axios';
import { API_BASE_URL } from '../constants';

// Cloudinary configuration from environment variables
// Note: API Secret should NEVER be exposed in frontend code - use unsigned upload preset instead
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

// Use Cloudinary if cloud name and upload preset are configured
const USE_CLOUDINARY = !!CLOUDINARY_CLOUD_NAME && !!CLOUDINARY_UPLOAD_PRESET;

// Create axios instance with auth token (for fallback API uploads)
const createAuthInstance = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
};

// Create a fresh axios instance for Cloudinary WITHOUT any default headers
// Cloudinary rejects requests with Authorization headers for unsigned uploads
const createCloudinaryInstance = () => {
  // Create instance without inheriting global defaults
  const instance = axios.create();
  
  // Explicitly remove Authorization header if it exists in defaults
  delete instance.defaults.headers.common['Authorization'];
  delete instance.defaults.headers['Authorization'];
  
  return instance;
};

// Cloudinary upload function using unsigned upload preset
const uploadToCloudinary = async (file, folder = 'mandap-events') => {
  if (!USE_CLOUDINARY || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary is not properly configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('resource_type', 'auto');

  try {
    // Use fresh axios instance without any auth headers
    // Cloudinary rejects requests with Authorization headers for unsigned uploads
    const cloudinaryInstance = createCloudinaryInstance();
    
    const response = await cloudinaryInstance.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Explicitly set Authorization to undefined to prevent it from being sent
          'Authorization': undefined,
        },
      }
    );

    return {
      success: true,
      url: response.data.secure_url,
      public_id: response.data.public_id,
      format: response.data.format,
      width: response.data.width,
      height: response.data.height,
      bytes: response.data.bytes,
      // Maintain compatibility with existing code
      filename: response.data.public_id,
      image: response.data.secure_url,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.response?.data?.error?.message || 'Cloudinary upload failed');
  }
};

// Delete from Cloudinary (requires backend API for security with API secret)
const deleteFromCloudinary = async (publicId) => {
  // Deletion requires API secret, so we'll call backend API
  try {
    const authInstance = createAuthInstance();
    const response = await authInstance.delete(`/upload/cloudinary/${publicId}`);
    return response.data;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(error.response?.data?.message || 'Delete failed');
  }
};

export const uploadApi = {
  // Upload image file (for events) - uses Cloudinary if configured, otherwise backend API
  uploadImage: async (file) => {
    try {
      console.log('UploadApi - Uploading image:', file.name);
      
      if (USE_CLOUDINARY) {
        return await uploadToCloudinary(file, 'mandap-events');
      } else {
        // Fallback to backend API upload
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
      }
    } catch (error) {
      console.error('UploadApi - Upload error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Upload failed');
      }
      throw error;
    }
  },

  // Upload profile image file
  uploadProfileImage: async (file) => {
    try {
      console.log('UploadApi - Uploading profile image:', file.name);
      
      if (USE_CLOUDINARY) {
        return await uploadToCloudinary(file, 'mandap-profiles');
      } else {
        // Fallback to backend API upload
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
      }
    } catch (error) {
      console.error('UploadApi - Profile upload error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Upload failed');
      }
      throw error;
    }
  },

  // Delete uploaded file
  deleteImage: async (filename) => {
    try {
      console.log('UploadApi - Deleting image:', filename);
      
      if (USE_CLOUDINARY) {
        // Extract public_id from filename (could be a URL or public_id)
        const publicId = filename.includes('cloudinary.com') 
          ? filename.split('/').slice(-2).join('/').replace(/\.[^/.]+$/, '')
          : filename;
        return await deleteFromCloudinary(publicId);
      } else {
        // Fallback to backend API delete
        const authInstance = createAuthInstance();
        const response = await authInstance.delete(`/upload/${filename}`);
        console.log('UploadApi - Delete response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('UploadApi - Delete error:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Delete failed');
      }
      throw new Error('Network error during delete');
    }
  },

  // Get full image URL - handles both Cloudinary URLs and local uploads
  // Accepts either a filename or an object with {image, imageURL} fields
  getImageUrl: (filenameOrObject) => {
    // Handle object with imageURL and image fields (prioritize imageURL)
    let filename = null;
    let imageURL = null;
    
    if (typeof filenameOrObject === 'object' && filenameOrObject !== null) {
      imageURL = filenameOrObject.imageURL;
      filename = filenameOrObject.image;
    } else {
      filename = filenameOrObject;
    }
    
    // Priority 1: If imageURL is provided and is a full URL, use it directly
    if (imageURL && imageURL.startsWith('http')) {
      return imageURL;
    }
    
    // Priority 2: If imageURL is a local path, construct full local URL
    if (imageURL && !imageURL.startsWith('http')) {
      const baseUrl = API_BASE_URL.replace('/api', '');
      // Remove leading slash if present to avoid double slashes
      const cleanPath = imageURL.startsWith('/') ? imageURL.slice(1) : imageURL;
      return `${baseUrl}/${cleanPath}`;
    }
    
    // Priority 3: Use filename (if provided)
    if (!filename) return null;
    
    // If it's already a full URL, return as is
    if (filename.startsWith('http')) return filename;
    
    // If using Cloudinary, construct Cloudinary URL
    if (USE_CLOUDINARY) {
      const hasFolder = filename.includes('/');
      const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
      
      // If it has a folder structure, it's definitely a Cloudinary public_id
      if (hasFolder) {
        // Encode spaces and special characters properly for Cloudinary
        const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, '/');
        return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${encodedFilename}`;
      }
      
      // If no extension, likely a Cloudinary public_id
      if (!hasExtension) {
        const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, '/');
        return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${encodedFilename}`;
      }
      
      // If it has an extension, could be Cloudinary or local
      const isLocalPath = filename.startsWith('./') || filename.includes('\\');
      
      if (!isLocalPath) {
        // Encode spaces for Cloudinary URLs (spaces should be %20)
        const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, '/');
        return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${encodedFilename}`;
      }
    }
    
    // Fallback: local uploads URL (encode spaces in filename for URL)
    const baseUrl = API_BASE_URL.replace('/api', '');
    const encodedFilename = encodeURIComponent(filename);
    return `${baseUrl}/uploads/event-images/${encodedFilename}`;
  },

  // Get image URL with CORS proxy fallback
  getImageUrlWithFallback: (filename) => {
    return uploadApi.getImageUrl(filename);
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
