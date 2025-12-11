import axios from 'axios';
import { API_BASE_URL } from '../constants';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth header
const createAuthInstance = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Only add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return axios.create({
    baseURL: API_BASE_URL,
    headers
  });
};

// Create public axios instance (no auth required)
// No timeout set - allows slow networks to complete requests naturally
const createPublicInstance = () => {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 0, // No timeout - allow slow networks to complete
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const eventApi = {
  // Get all events with filtering and pagination
  getEvents: async (params = {}) => {
    try {
      // Try public access first (for unauthenticated users)
      const publicInstance = createPublicInstance();
      const response = await publicInstance.get('/events', { params });
      return response.data;
    } catch (error) {
      // If public access fails, try with authentication
      if (error.response?.status === 401) {
        try {
          const authInstance = createAuthInstance();
          const response = await authInstance.get('/events', { params });
          return response.data;
        } catch (authError) {
          console.error('Error fetching events (authenticated):', authError);
          throw authError;
        }
      }
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Get single event by ID
  getEvent: async (id) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  // Create new event
  createEvent: async (eventData) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.post('/events', eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Update event
  updateEvent: async (id, eventData) => {
    try {
      const token = getAuthToken();
      
      // Check if eventData is FormData (for image uploads)
      const isFormData = eventData instanceof FormData;
      
      console.log('eventApi.updateEvent - Called with:', {
        id,
        isFormData,
        eventDataType: typeof eventData,
        hasImage: isFormData ? 'Yes (FormData)' : 'No (JSON)'
      });
      
      // Create instance - don't set Content-Type if FormData (browser sets it automatically)
      const instance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      const response = await instance.put(`/events/${id}`, eventData);
      
      console.log('eventApi.updateEvent - Full response:', response);
      console.log('eventApi.updateEvent - Response data:', response.data);
      console.log('eventApi.updateEvent - Response status:', response.status);
      
      if (response.data) {
        const event = response.data.event || response.data;
        console.log('eventApi.updateEvent - Event object:', event);
        console.log('eventApi.updateEvent - Event.image:', event.image);
        console.log('eventApi.updateEvent - Event.imageURL:', event.imageURL);
        
        if (isFormData) {
          console.log('eventApi.updateEvent - This was a FormData update (with image)');
          console.log('eventApi.updateEvent - Backend returned image field:', event.image);
          console.log('eventApi.updateEvent - Backend returned imageURL field:', event.imageURL);
          
          // Try to construct what the full URL would be
          if (event.imageURL) {
            console.log('eventApi.updateEvent - imageURL is a full URL:', event.imageURL.startsWith('http'));
          }
          if (event.image) {
            console.log('eventApi.updateEvent - image field value:', event.image);
            console.log('eventApi.updateEvent - image is a full URL:', event.image.startsWith('http'));
          }
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('eventApi.updateEvent - Error:', error);
      console.error('eventApi.updateEvent - Error response:', error.response);
      console.error('eventApi.updateEvent - Error response data:', error.response?.data);
      throw error;
    }
  },

  // Delete event
  deleteEvent: async (id) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.delete(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // Get event statistics
  getEventStats: async () => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/events/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching event stats:', error);
      throw error;
    }
  },

  // Update event status
  updateEventStatus: async (id, status) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.put(`/events/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating event status:', error);
      throw error;
    }
  },

  // Register for event
  registerForEvent: async (id, registrationData) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.post(`/events/${id}/register`, registrationData);
      return response.data;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  // Get event registrations
  getEventRegistrations: async (id) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get(`/events/${id}/registrations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event registrations:', error);
      throw error;
    }
  },

  // Exhibitors: List
  listExhibitors: async (eventId) => {
    try {
      const publicInstance = createPublicInstance();
      const response = await publicInstance.get(`/events/${eventId}/exhibitors`);
      return response.data;
    } catch (error) {
      // fallback with auth if needed
      if (error.response?.status === 401) {
        const authInstance = createAuthInstance();
        const response = await authInstance.get(`/events/${eventId}/exhibitors`);
        return response.data;
      }
      console.error('Error listing exhibitors:', error);
      throw error;
    }
  },

  // Exhibitors: Create
  createExhibitor: async (eventId, payload) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.post(`/events/${eventId}/exhibitors`, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating exhibitor:', error);
      throw error;
    }
  },

  // Exhibitors: Update
  updateExhibitor: async (eventId, exhibitorId, payload) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.put(`/events/${eventId}/exhibitors/${exhibitorId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating exhibitor:', error);
      throw error;
    }
  },

  // Exhibitors: Delete
  deleteExhibitor: async (eventId, exhibitorId) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.delete(`/events/${eventId}/exhibitors/${exhibitorId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting exhibitor:', error);
      throw error;
    }
  },

  // Attendance via QR check-in (idempotent)
  checkinByQr: async (qrToken) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.post('/events/checkin', { qrToken });
      return response.data;
    } catch (error) {
      console.error('Error during check-in:', error);
      throw error;
    }
  },

  // Event Registration Payment Flow
  // Initiate payment registration
  initiatePayment: async (eventId, memberId = null) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.post(`/events/${eventId}/register-payment`, { memberId });
      return response.data;
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  },

  // Confirm payment and complete registration
  confirmPayment: async (eventId, paymentData, memberId = null) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.post(`/events/${eventId}/confirm-payment`, {
        ...paymentData,
        memberId
      });
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  // Check registration status
  checkRegistrationStatus: async (eventId, memberId = null) => {
    try {
      const authInstance = createAuthInstance();
      const params = memberId ? { memberId } : {};
      const response = await authInstance.get(`/events/${eventId}/my-registration`, { params });
      return response.data;
    } catch (error) {
      console.error('Error checking registration status:', error);
      throw error;
    }
  },

  // Get my registrations
  getMyRegistrations: async () => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/events/my/registrations');
      return response.data;
    } catch (error) {
      console.error('Error fetching my registrations:', error);
      throw error;
    }
  },

  // Get event by ID (public access supported)
  getEventPublic: async (id) => {
    try {
      // Try public access first
      const publicInstance = createPublicInstance();
      const response = await publicInstance.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      // Fallback to authenticated if needed
      if (error.response?.status === 401) {
        const authInstance = createAuthInstance();
        const response = await authInstance.get(`/events/${id}`);
        return response.data;
      }
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  // Public Event Registration APIs (no authentication required)
  
  // Get public event details
  getPublicEvent: async (id) => {
    try {
      const publicInstance = createPublicInstance();
      const response = await publicInstance.get(`/public/events/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching public event:', error);
      throw error;
    }
  },

  // Check registration status by phone (public)
  checkPublicRegistrationStatus: async (eventId, phone) => {
    try {
      const publicInstance = createPublicInstance();
      const response = await publicInstance.get(`/public/events/${eventId}/check-registration`, {
        params: { phone }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking registration status:', error);
      throw error;
    }
  },

  // Initiate public registration and payment
  initiatePublicRegistration: async (eventId, registrationData) => {
    try {
      // Always send as JSON (photo should be uploaded to Cloudinary first and URL included)
      console.log('eventApi.initiatePublicRegistration - Called with:', {
        eventId,
        registrationDataType: typeof registrationData,
        isFormData: registrationData instanceof FormData,
        isObject: typeof registrationData === 'object' && registrationData !== null
      });
      
      // Log registration data
      if (registrationData instanceof FormData) {
        console.log('eventApi.initiatePublicRegistration - WARNING: FormData received, but backend expects JSON');
        console.log('eventApi.initiatePublicRegistration - FormData contents:');
        for (const [key, value] of registrationData.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, type: ${value.type})`);
          } else {
            console.log(`  ${key}: "${value}" (type: ${typeof value})`);
          }
        }
        throw new Error('FormData is not supported. Please upload photo to Cloudinary first and send URL in JSON payload.');
      } else {
        console.log('eventApi.initiatePublicRegistration - JSON payload:', JSON.stringify(registrationData, null, 2));
      }
      
      // Create instance with JSON Content-Type
      const publicInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('eventApi.initiatePublicRegistration - Making POST request to:', `/public/events/${eventId}/register-payment`);
      console.log('eventApi.initiatePublicRegistration - Request headers:', publicInstance.defaults.headers);
      const response = await publicInstance.post(`/public/events/${eventId}/register-payment`, registrationData);
      console.log('eventApi.initiatePublicRegistration - Response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('eventApi.initiatePublicRegistration - Error occurred:');
      console.error('  Error message:', error.message);
      console.error('  Error response status:', error.response?.status);
      console.error('  Error response data:', error.response?.data);
      console.error('  Error response headers:', error.response?.headers);
      
      if (error.response?.data?.errors) {
        console.error('  Validation errors:', error.response.data.errors);
      }
      
      throw error;
    }
  },

  // Confirm payment and complete registration (public) with retry logic
  // No timeout - let the request complete naturally to ensure payment is confirmed
  confirmPublicPayment: async (eventId, paymentData, maxRetries = 5) => {
    const retryDelays = [2000, 3000, 5000, 7000, 10000]; // Exponential backoff: 2s, 3s, 5s, 7s, 10s
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const publicInstance = createPublicInstance();
        
        console.log(`[Payment Confirmation] Attempt ${attempt + 1}/${maxRetries} for event ${eventId}`);
        console.log(`[Payment Confirmation] Payment ID: ${paymentData.razorpay_payment_id}`);
        console.log(`[Payment Confirmation] Order ID: ${paymentData.razorpay_order_id}`);
        
        // Make the request WITHOUT timeout - let it complete naturally
        // Payment confirmation is critical, we must wait for it
        // Don't set timeout option - axios will use default (no timeout)
        const response = await publicInstance.post(
          `/public/events/${eventId}/confirm-payment`,
          paymentData
          // No timeout option - axios default is no timeout, request will wait for response
        );
        
        console.log(`[Payment Confirmation] ✅ Success on attempt ${attempt + 1}`);
        return response.data;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;
        const isNetworkError = error.code === 'ERR_NETWORK' || 
                              error.code === 'ETIMEDOUT' ||
                              error.code === 'ECONNABORTED' ||
                              error.code === 'ENOTFOUND' ||
                              error.code === 'ECONNREFUSED';
        
        console.error(`[Payment Confirmation] ❌ Attempt ${attempt + 1}/${maxRetries} failed:`, {
          error: error.message || error.code,
          status: error.response?.status,
          isNetworkError,
          isLastAttempt
        });
        
        // If it's the last attempt, throw the error
        if (isLastAttempt) {
          console.error(`[Payment Confirmation] ❌ All ${maxRetries} attempts failed`);
          throw error;
        }
        
        // If it's a network error, retry with exponential backoff
        if (isNetworkError) {
          const delay = retryDelays[attempt] || 10000;
          console.log(`[Payment Confirmation] ⏳ Network error detected. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }
        
        // For other errors (like validation errors, 400, 404), don't retry
        console.error(`[Payment Confirmation] ❌ Non-retryable error: ${error.response?.status || error.code}`);
        throw error;
      }
    }
    
    // Should never reach here, but just in case
    throw new Error('Payment confirmation failed after all retries');
  },

  // Trigger auto-send for new registrations (PDFs are now generated on-demand in backend)
  saveRegistrationPdf: async (eventId, registrationId) => {
    try {
      const publicInstance = createPublicInstance();
      const response = await publicInstance.post(
        `/public/events/${eventId}/registrations/${registrationId}/save-pdf`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error('Error triggering auto-send:', error);
      throw error;
    }
  },

  // Download PDF (generated on-demand in backend)
  downloadRegistrationPdf: async (eventId, registrationId) => {
    try {
      const publicInstance = createPublicInstance();
      const response = await publicInstance.get(
        `/public/events/${eventId}/registrations/${registrationId}/download-pdf`,
        {
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },

  // Send WhatsApp message with PDF (PDF generated on-demand, sent, then deleted)
  // Uses authenticated instance when called from manager panel to track who sent it
  // forceResend: if true, allows resending even if already sent (for manual sends from registrations table)
  sendRegistrationPdfViaWhatsApp: async (eventId, registrationId, forceResend = true) => {
    try {
      // Add force parameter for manual sends (from registrations table/view details)
      const queryParams = forceResend ? '?force=true' : '';
      
      // Try authenticated first (for manager panel), fallback to public
      try {
        const authInstance = createAuthInstance();
        const response = await authInstance.post(
          `/public/events/${eventId}/registrations/${registrationId}/send-whatsapp${queryParams}`
        );
        return response.data;
      } catch (authError) {
        // If auth fails, try public (for public registration page)
        const publicInstance = createPublicInstance();
        const response = await publicInstance.post(
          `/public/events/${eventId}/registrations/${registrationId}/send-whatsapp${queryParams}`
        );
        return response.data;
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      throw error;
    }
  },

  // Create manual registration (for manager panel with cash payment)
  createManualRegistration: async (eventId, registrationData) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.post(
        `/events/${eventId}/manual-registration`,
        registrationData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating manual registration:', error);
      throw error;
    }
  }
};

// Public Association API
export const publicAssociationApi = {
  // Get associations by city (public)
  getAssociationsByCity: async (city) => {
    try {
      const publicInstance = createPublicInstance();
      const response = await publicInstance.get('/public/associations', {
        params: { city }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching associations:', error);
      throw error;
    }
  }
};

// Export eventApi as default (it's already exported as named export via export const)
export default eventApi;








