// API wrapper utilities
const API_BASE_URL = window.CONFIG.API_BASE_URL;

window.api = {
    // --- Event API ---
    getPublicEvent: async (eventId) => {
        const response = await fetch(`${API_BASE_URL}/public/events/${eventId}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Event not found');
            }
            throw new Error('Failed to load event details');
        }
        return await response.json();
    },

    checkPublicRegistrationStatus: async (eventId, phone) => {
        const response = await fetch(`${API_BASE_URL}/public/events/${eventId}/registration-status?phone=${phone}`);
        if (!response.ok) {
            throw new Error('Failed to verify registration status');
        }
        return await response.json();
    },

    initiatePublicRegistration: async (eventId, payload) => {
        const response = await fetch(`${API_BASE_URL}/public/events/${eventId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status } };
        }
        return data;
    },

    confirmPublicPayment: async (eventId, payload) => {
        const response = await fetch(`${API_BASE_URL}/public/events/${eventId}/confirm-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status } };
        }
        return data;
    },

    downloadRegistrationPdf: async (eventId, registrationId) => {
        const response = await fetch(`${API_BASE_URL}/public/events/${eventId}/registrations/${registrationId}/pdf`);
        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }
        return await response.blob();
    },

    // --- Association API ---
    getAssociationsByCity: async (city) => {
        const response = await fetch(`${API_BASE_URL}/public/associations/city/${city}`);
        if (!response.ok) {
            throw new Error('Failed to load associations');
        }
        return await response.json();
    },

    // --- Upload API ---
    optimizeImage: (file, options = {}) => {
        return new Promise((resolve, reject) => {
            const {
                maxWidth = 800,
                maxHeight = 800,
                quality = 0.85,
                maxSizeMB = 1,
            } = options;

            if (!file.type.startsWith('image/')) {
                resolve(file);
                return;
            }

            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                const originalWidth = img.width;
                const originalHeight = img.height;
                
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

                if (!needsResize && file.size <= maxSizeMB * 1024 * 1024) {
                    URL.revokeObjectURL(img.src);
                    resolve(file);
                    return;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                URL.revokeObjectURL(img.src);

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

                            if (optimizedFile.size > maxSizeMB * 1024 * 1024 && currentQuality > 0.5) {
                                tryCompress(currentQuality - 0.1);
                            } else {
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
                URL.revokeObjectURL(img.src);
                resolve(file);
            };

            img.src = URL.createObjectURL(file);
        });
    },

    uploadProfileImage: async (file) => {
        // Use Cloudinary if configured
        if (window.CONFIG.CLOUDINARY.USE_CLOUDINARY) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', window.CONFIG.CLOUDINARY.UPLOAD_PRESET);
            formData.append('folder', 'mandap-profiles');
            formData.append('resource_type', 'auto');

            const response = await fetch(`https://api.cloudinary.com/v1_1/${window.CONFIG.CLOUDINARY.CLOUD_NAME}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Cloudinary upload failed');
            }

            const data = await response.json();
            return {
                success: true,
                url: data.secure_url,
                filename: data.public_id,
                image: data.secure_url,
            };
        } else {
            // Fallback to backend API upload
            const formData = new FormData();
            formData.append('image', file);

            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/upload/profile-image`, {
                method: 'POST',
                headers,
                body: formData
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            const fileData = data.file || data || {};
            return {
                success: data.success ?? true,
                url: fileData.url || fileData.localUrl || null,
                filename: fileData.filename || null,
                image: fileData.url || fileData.localUrl || null,
            };
        }
    },

    getImageUrl: (filenameOrObject) => {
        let filename = null;
        let imageURL = null;
        
        if (typeof filenameOrObject === 'object' && filenameOrObject !== null) {
            imageURL = filenameOrObject.imageURL;
            filename = filenameOrObject.image;
        } else {
            filename = filenameOrObject;
        }
        
        if (imageURL && typeof imageURL === 'string' && imageURL.startsWith('http')) {
            return imageURL;
        }
        
        if (filename && typeof filename === 'string' && filename.startsWith('http')) {
            return filename;
        }

        if (!filename) return null;

        if (window.CONFIG.CLOUDINARY.USE_CLOUDINARY) {
            const hasFolder = filename.includes('/');
            const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
            
            if (hasFolder || !hasExtension) {
                const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, '/');
                return `https://res.cloudinary.com/${window.CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload/${encodedFilename}`;
            }
            
            const isLocalPath = filename.startsWith('./') || filename.includes('\\');
            if (!isLocalPath) {
                const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, '/');
                return `https://res.cloudinary.com/${window.CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload/${encodedFilename}`;
            }
        }
        
        const baseUrl = API_BASE_URL.replace('/api', '');
        const normalizePath = (value) => value.replace(/^\/+/, '').replace(/\\/g, '/');
        const encodePath = (value) => value.split('/').map(segment => encodeURIComponent(segment)).join('/');
        const normalized = normalizePath(filename);
        const [firstSegment] = normalized.split('/');
        
        const knownSubDirs = ['uploads', 'event-images', 'profile-images', 'business-images', 'gallery-images', 'documents', 'images', 'general'];
        if (firstSegment === 'uploads') {
            return `${baseUrl}/${encodePath(normalized)}`;
        }
        if (knownSubDirs.includes(firstSegment)) {
            return `${baseUrl}/uploads/${encodePath(normalized)}`;
        }
        return `${baseUrl}/uploads/event-images/${encodePath(normalized)}`;
    }
};
