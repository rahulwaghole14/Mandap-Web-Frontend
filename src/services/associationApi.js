import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  console.log('Association API - Token being sent:', token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Association API - Authorization header set:', config.headers.Authorization);
  } else {
    console.log('Association API - No token found in localStorage');
  }
  return config;
});

export const associationApi = {
  // Get all associations
  getAssociations: async (params = {}) => {
    try {
      const response = await api.get('/associations', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching associations:', error);
      throw error;
    }
  },

  // Get association by ID
  getAssociation: async (id) => {
    try {
      const response = await api.get(`/associations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching association:', error);
      throw error;
    }
  },

  // Create new association
  createAssociation: async (associationData) => {
    try {
      const response = await api.post('/associations', associationData);
      return response.data;
    } catch (error) {
      console.error('Error creating association:', error);
      throw error;
    }
  },

  // Update association
  updateAssociation: async (id, associationData) => {
    try {
      const response = await api.put(`/associations/${id}`, associationData);
      return response.data;
    } catch (error) {
      console.error('Error updating association:', error);
      throw error;
    }
  },

  // Delete association
  deleteAssociation: async (id) => {
    try {
      const response = await api.delete(`/associations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting association:', error);
      throw error;
    }
  },

  // Toggle association status
  toggleStatus: async (id, status) => {
    try {
      const response = await api.put(`/associations/${id}/toggle-status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error toggling association status:', error);
      throw error;
    }
  },

  // Get association statistics
  getStats: async () => {
    try {
      const response = await api.get('/associations/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching association statistics:', error);
      throw error;
    }
  }
};
