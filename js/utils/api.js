// API wrapper utilities
const API_BASE_URL = window.CONFIG.API_BASE_URL;

window.api = {
    // --- Auth API ---
    logout: async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Production-ready logout request
                const response = await fetch(`${window.CONFIG.API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                
                const data = await response.json();
                if (data.success) {
                    console.log(data.message);
                }
            } catch (error) {
                console.error('[Logout API] Error:', error);
            }
        }
        
        // Securely clear all user-related data from local storage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        
        // Redirect to login
        window.location.href = 'login.html';
    },

    // --- Event API ---
    getPublicEvent: async (eventId) => {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Event not found');
            }
            throw new Error('Failed to load event details');
        }
        const json = await response.json();
        return json.data || json.event || json;
    },

    checkPublicRegistrationStatus: async (eventId, phone) => {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Endpoint matches React: /check-registration?phone=... (not /registration-status)
        const response = await fetch(
            `${API_BASE_URL}/events/${eventId}/check-registration?phone=${encodeURIComponent(phone)}`,
            { headers }
        );
        if (!response.ok) {
            throw new Error('Failed to verify registration status');
        }
        return await response.json();
    },

    initiatePublicRegistration: async (eventId, payload) => {
        // Correct endpoint: /public/events/{id}/register-payment
        const response = await fetch(`${API_BASE_URL}/public/events/${eventId}/register-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status } };
        }
        return data;
    },

    createManualRegistration: async (eventId, payload) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/${eventId}/manual-registration`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Registration failed' };
        }
        return data;
    },

    initiateRazorpayManualRegistration: async (eventId, payload) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/${eventId}/initiate`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Initiation failed' };
        }
        return data;
    },

    // Confirm admin manual Razorpay payment
    confirmRazorpayManualPayment: async (eventId, payload) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/${eventId}/confirm-payment`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Confirmation failed' };
        }
        return data;
    },

    initiatePayment: async (eventId, memberId = null) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/${eventId}/register-payment`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ memberId })
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Payment initiation failed' };
        }
        return data;
    },

    confirmPayment: async (eventId, paymentData, memberId = null) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/${eventId}/confirm-payment`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ ...paymentData, memberId })
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Payment confirmation failed' };
        }
        return data;
    },

    /**
     * Confirm payment with retry logic + exponential backoff.
     * Mirrors the React confirmPublicPayment implementation.
     * Retries only on network errors (ECONNRESET, etc.) – not on 4xx/5xx.
     */
    confirmPublicPayment: async (eventId, payload, maxRetries = 5) => {
        const retryDelays = [2000, 3000, 5000, 7000, 10000];

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            console.log(`[Payment Confirmation] Attempt ${attempt + 1}/${maxRetries} for event ${eventId}`);
            console.log(`[Payment Confirmation] Payment ID: ${payload.razorpay_payment_id}`);
            console.log(`[Payment Confirmation] Order ID: ${payload.razorpay_order_id}`);

            try {
                const response = await fetch(
                    `${API_BASE_URL}/events/${eventId}/confirm-payment`,
                    {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    // 4xx/5xx are non-retryable – throw immediately
                    console.error(`[Payment Confirmation] ❌ Non-retryable HTTP ${response.status}`);
                    throw { response: { data, status: response.status } };
                }

                console.log(`[Payment Confirmation] ✅ Success on attempt ${attempt + 1}`);
                return data;

            } catch (error) {
                const isLastAttempt = attempt === maxRetries - 1;

                // Non-retryable: has an HTTP response (4xx/5xx already thrown above)
                if (error.response) {
                    throw error;
                }

                // Network-level error (TypeError: Failed to fetch, AbortError, etc.)
                const isNetworkError = error instanceof TypeError ||
                                       error.name === 'AbortError' ||
                                       error.name === 'NetworkError';

                console.error(`[Payment Confirmation] ❌ Attempt ${attempt + 1}/${maxRetries} failed:`, {
                    message: error.message,
                    isNetworkError,
                    isLastAttempt
                });

                if (isLastAttempt) {
                    console.error(`[Payment Confirmation] ❌ All ${maxRetries} attempts failed`);
                    throw error;
                }

                if (isNetworkError) {
                    const delay = retryDelays[attempt] || 10000;
                    console.log(`[Payment Confirmation] ⏳ Network error. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                // Any other unknown error – don't retry
                throw error;
            }
        }

        throw new Error('Payment confirmation failed after all retries');
    },

    downloadRegistrationPdf: async (eventId, registrationId) => {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/registrations/${registrationId}/pdf`);
        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }
        return await response.blob();
    },

    // --- Association API ---
    getAssociationsByCity: async (city) => {
        const response = await fetch(`${API_BASE_URL}/associations/city/${city}`);
        if (!response.ok) {
            throw new Error('Failed to load associations');
        }
        return await response.json();
    },

    getAssociationById: async (id) => {
        const token = localStorage.getItem('token');
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/associations/${id}`, {
            headers: headers
        });
        if (!response.ok) {
            throw new Error('Failed to load association details');
        }
        return await response.json();
    },

    getAssociationMembers: async (associationId) => {
        const token = localStorage.getItem('token');
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/members/association/${associationId}`, {
            headers: headers
        });
        if (!response.ok) {
            throw new Error('Failed to load association members');
        }
        return await response.json();
    },

    getAssociationBOD: async (associationId) => {
        const token = localStorage.getItem('token');
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/bod/association/${associationId}`, {
            headers: headers
        });
        if (!response.ok) {
            throw new Error('Failed to load association BOD');
        }
        return await response.json();
    },

    updateAssociation: async (id, data) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/associations/${id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(data)
        });
        
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
        // Optimize image before upload (mirrors React's uploadApi.optimizeImage)
        let fileToUpload = file;
        try {
            fileToUpload = await window.api.optimizeImage(file, {
                maxWidth: 800,
                maxHeight: 800,
                quality: 0.85,
                maxSizeMB: 1
            });
            console.log(`[Upload] Image optimized: ${file.size} bytes → ${fileToUpload.size} bytes`);
        } catch (optimizeErr) {
            console.warn('[Upload] Image optimization failed, using original file:', optimizeErr);
            fileToUpload = file;
        }

        // Use Cloudinary if configured
        if (window.CONFIG.CLOUDINARY.USE_CLOUDINARY) {
            const formData = new FormData();
            formData.append('file', fileToUpload);
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
            formData.append('image', fileToUpload);

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
