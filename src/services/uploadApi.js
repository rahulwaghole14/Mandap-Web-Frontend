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
    
    console.log('uploadToCloudinary - Uploading to Cloudinary:', {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      folder: folder,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
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

    console.log('uploadToCloudinary - Cloudinary response:', response.data);
    console.log('uploadToCloudinary - secure_url:', response.data.secure_url);
    console.log('uploadToCloudinary - public_id:', response.data.public_id);
    console.log('uploadToCloudinary - format:', response.data.format);
    console.log('uploadToCloudinary - width:', response.data.width);
    console.log('uploadToCloudinary - height:', response.data.height);
    console.log('uploadToCloudinary - bytes:', response.data.bytes);

    const result = {
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
    
    console.log('uploadToCloudinary - Returning result object:', result);
    console.log('uploadToCloudinary - Result.url (secure_url):', result.url);
    console.log('uploadToCloudinary - Result.filename (public_id):', result.filename);
    console.log('uploadToCloudinary - Result.image (secure_url):', result.image);

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.response?.data?.error?.message || 'Cloudinary upload failed');
  }
};

// Image optimization: resize and compress before upload
const optimizeImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.85, // 85% quality for JPEG
      maxSizeMB = 2, // Maximum file size in MB after optimization
    } = options;

    // If file is not an image, return as-is
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Store original dimensions before any operations
      const originalWidth = img.width;
      const originalHeight = img.height;
      
      // Calculate new dimensions maintaining aspect ratio
      let width = originalWidth;
      let height = originalHeight;
      const needsResize = width > maxWidth || height > maxHeight;
      
      if (needsResize) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // If dimensions are within limits and file size is acceptable, return as-is
      if (!needsResize && file.size <= maxSizeMB * 1024 * 1024) {
        URL.revokeObjectURL(img.src);
        resolve(file);
        return;
      }

      // Resize if needed
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Clean up object URL
      URL.revokeObjectURL(img.src);

      // Try different quality levels if file is still too large
      const tryCompress = (currentQuality) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image optimization failed'));
              return;
            }

            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            // If still too large and quality can be reduced, try again
            if (optimizedFile.size > maxSizeMB * 1024 * 1024 && currentQuality > 0.5) {
              tryCompress(currentQuality - 0.1);
            } else {
              console.log('Image optimized:', {
                originalSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                optimizedSize: (optimizedFile.size / 1024 / 1024).toFixed(2) + ' MB',
                originalDimensions: `${originalWidth}x${originalHeight}`,
                optimizedDimensions: `${width}x${height}`,
                finalQuality: currentQuality,
                compressionRatio: ((1 - optimizedFile.size / file.size) * 100).toFixed(1) + '%',
              });
              resolve(optimizedFile);
            }
          },
          file.type,
          currentQuality
        );
      };

      tryCompress(quality);
    };

    img.onerror = () => {
      console.warn('Failed to load image for optimization, using original file');
      URL.revokeObjectURL(img.src);
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
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
  uploadImage: async (file, options = {}) => {
    try {
      console.log('UploadApi - Uploading image:', file.name, 'Original size:', (file.size / 1024 / 1024).toFixed(2) + ' MB');
      
      // Optimize image before upload
      const optimizedFile = await optimizeImage(file, {
        maxWidth: options.maxWidth || 1920,
        maxHeight: options.maxHeight || 1920,
        quality: options.quality || 0.85,
        maxSizeMB: options.maxSizeMB || 2,
      });
      
      // Validate optimized file size (should be under target, but double-check)
      const finalMaxSizeMB = options.maxSizeMB || 2;
      if (optimizedFile.size > finalMaxSizeMB * 1024 * 1024) {
        console.warn('UploadApi - Optimized file still exceeds target size:', (optimizedFile.size / 1024 / 1024).toFixed(2) + ' MB');
        // Still proceed, but log a warning
      }
      
      if (USE_CLOUDINARY) {
        return await uploadToCloudinary(optimizedFile, 'mandap-events');
      } else {
        // Fallback to backend API upload
        const formData = new FormData();
        formData.append('image', optimizedFile);
        
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
  uploadProfileImage: async (file, options = {}) => {
    try {
      console.log('UploadApi - Uploading profile image:', file.name, 'Original size:', (file.size / 1024 / 1024).toFixed(2) + ' MB');
      
      // Optimize image before upload (smaller dimensions for profile images)
      const optimizedFile = await optimizeImage(file, {
        maxWidth: options.maxWidth || 800,
        maxHeight: options.maxHeight || 800,
        quality: options.quality || 0.85,
        maxSizeMB: options.maxSizeMB || 1,
      });
      
      if (USE_CLOUDINARY) {
        return await uploadToCloudinary(optimizedFile, 'mandap-profiles');
      }

      // Fallback to backend API upload
      const formData = new FormData();
      formData.append('image', optimizedFile);

      const authInstance = createAuthInstance();
      const response = await authInstance.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('UploadApi - Profile upload response:', response.data);

      const fileData = (response.data && response.data.file) || response.data || {};

      return {
        success: response.data?.success ?? true,
        message: response.data?.message,
        url: fileData.url || fileData.localUrl || null,
        image: fileData.url || fileData.localUrl || null,
        filename: fileData.filename || null,
        localUrl: fileData.localUrl || null,
        raw: response.data
      };
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
    const buildLocalUrl = (rawPath) => {
      if (!rawPath) return null;

      const baseUrl = API_BASE_URL.replace('/api', '');
      const knownSubDirs = [
        'uploads',
        'event-images',
        'profile-images',
        'business-images',
        'gallery-images',
        'documents',
        'images',
        'general'
      ];

      const normalizePath = (value) => value.replace(/^\/+/, '').replace(/\\/g, '/');
      const encodePath = (value) =>
        value
          .split('/')
          .map((segment) => encodeURIComponent(segment))
          .join('/');

      const normalized = normalizePath(rawPath);
      if (!normalized) return null;

      const [firstSegment] = normalized.split('/');

      if (firstSegment === 'uploads') {
        return `${baseUrl}/${encodePath(normalized)}`;
      }

      if (knownSubDirs.includes(firstSegment)) {
        return `${baseUrl}/uploads/${encodePath(normalized)}`;
      }

      return `${baseUrl}/uploads/event-images/${encodePath(normalized)}`;
    };

    // Handle object with imageURL and image fields
    let filename = null;
    let imageURL = null;
    
    if (typeof filenameOrObject === 'object' && filenameOrObject !== null) {
      imageURL = filenameOrObject.imageURL;
      filename = filenameOrObject.image;
    } else {
      filename = filenameOrObject;
    }
    
    // Priority 1: If imageURL is provided and is a full URL (Cloudinary or other), use it directly
    if (imageURL && typeof imageURL === 'string' && imageURL.startsWith('http')) {
      return imageURL;
    }
    
    // Priority 2: If filename (image field) is a full URL (Cloudinary or other), use it directly
    // This handles cases where backend stores Cloudinary URL in image field but imageURL is old/null
    if (filename && typeof filename === 'string' && filename.startsWith('http')) {
      return filename;
    }
    
    // Priority 3: If imageURL is a local path, construct full local URL
    if (imageURL && typeof imageURL === 'string' && !imageURL.startsWith('http')) {
      return buildLocalUrl(imageURL);
    }
    
    // Priority 4: Use filename (if provided) for Cloudinary or local construction
    if (!filename) return null;

    const looksLikeLocalPath = (value) => {
      if (typeof value !== 'string') return false;
      const normalized = value.replace(/^\/+/, '').replace(/\\/g, '/');
      if (!normalized) return false;
      const firstSegment = normalized.split('/')[0];
      const localPrefixes = [
        '.',
        '..',
        'uploads',
        'event-images',
        'profile-images',
        'business-images',
        'gallery-images',
        'documents',
        'images',
        'general'
      ];
      return localPrefixes.includes(firstSegment);
    };

    if (looksLikeLocalPath(filename)) {
      return buildLocalUrl(filename);
    }
    
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
    return buildLocalUrl(filename);
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
  },

  // Export optimizeImage function for direct use (e.g., in registration forms)
  optimizeImage: optimizeImage
};
