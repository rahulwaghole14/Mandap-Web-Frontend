import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth header
const createAuthInstance = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const bodApi = {
  // Get all BOD members with filtering and pagination
  getBODs: async (params = {}) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/bod', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching BOD members:', error);
      throw error;
    }
  },

  // Get single BOD member by ID
  getBOD: async (id) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get(`/bod/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching BOD member:', error);
      throw error;
    }
  },

  // Create new BOD member
  createBOD: async (bodData) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.post('/bod', bodData);
      return response.data;
    } catch (error) {
      console.error('Error creating BOD member:', error);
      throw error;
    }
  },

  // Update BOD member
  updateBOD: async (id, bodData) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.put(`/bod/${id}`, bodData);
      return response.data;
    } catch (error) {
      console.error('Error updating BOD member:', error);
      throw error;
    }
  },

  // Delete BOD member
  deleteBOD: async (id) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.delete(`/bod/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting BOD member:', error);
      throw error;
    }
  },

  // Get BOD statistics
  getBODStats: async () => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/bod/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching BOD stats:', error);
      throw error;
    }
  },

  // Toggle BOD member active status
  toggleBODStatus: async (id) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.put(`/bod/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('Error toggling BOD status:', error);
      throw error;
    }
  }
};






