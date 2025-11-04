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
const createPublicInstance = () => {
  return axios.create({
    baseURL: API_BASE_URL,
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
      const authInstance = createAuthInstance();
      const response = await authInstance.put(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
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
  }
};








