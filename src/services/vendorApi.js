import axios from 'axios';

const API_BASE_URL = 'https://mandapam-backend-97mi.onrender.com/api';

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

export const vendorApi = {
  // Get all vendors with filtering and pagination
  getVendors: async (params = {}) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/vendors', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  // Get single vendor by ID
  getVendor: async (id) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get(`/vendors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  },

  // Create new vendor
  createVendor: async (vendorData) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.post('/vendors', vendorData);
      return response.data;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  },

  // Update vendor
  updateVendor: async (id, vendorData) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.put(`/vendors/${id}`, vendorData);
      return response.data;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  // Delete vendor
  deleteVendor: async (id) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.delete(`/vendors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  },

  // Get vendor statistics
  getVendorStats: async () => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/vendors/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      throw error;
    }
  },

  // Verify vendor
  verifyVendor: async (id) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.put(`/vendors/${id}/verify`);
      return response.data;
    } catch (error) {
      console.error('Error verifying vendor:', error);
      throw error;
    }
  }
};








