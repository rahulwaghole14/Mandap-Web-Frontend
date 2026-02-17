import axios from 'axios';
import { API_BASE_URL } from '../constants';

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

export const dashboardApi = {
  // Get dashboard overview statistics
  getDashboardStats: async () => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get recent members
  getRecentMembers: async (limit = 10) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get(`/dashboard/recent-members?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent members:', error);
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

  // Get member statistics
  getMemberStats: async () => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/members/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching member stats:', error);
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

  // Get association statistics
  getAssociationStats: async () => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/associations/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching association stats:', error);
      throw error;
    }
  },

  // Get district coverage data
  getDistrictCoverage: async () => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/dashboard/district-coverage');
      return response.data;
    } catch (error) {
      console.error('Error fetching district coverage:', error);
      throw error;
    }
  },

  // Get growth trends
  getGrowthTrends: async (period = 'monthly') => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get(`/dashboard/growth-trends?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching growth trends:', error);
      throw error;
    }
  },

  // Get associations for map
  getAssociationsForMap: async () => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get('/dashboard/associations-map');
      return response.data;
    } catch (error) {
      console.error('Error fetching associations for map:', error);
      throw error;
    }
  },

  // Get monthly member growth data for current year
  getMonthlyMemberGrowth: async (year = new Date().getFullYear()) => {
    try {
      const authInstance = createAuthInstance();
      const response = await authInstance.get(`/dashboard/monthly-member-growth?year=${year}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly member growth:', error);
      throw error;
    }
  },

  // Get top associations with growth comparison
  getTopAssociations: async (limit = 10) => {
    try {
      console.log('DashboardApi - Fetching top associations with limit:', limit);
      const authInstance = createAuthInstance();
      const response = await authInstance.get(`/dashboard/top-associations?limit=${limit}`);
      console.log('DashboardApi - Top associations response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching top associations:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  }
};
