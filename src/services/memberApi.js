import axios from 'axios';

const API_BASE_URL = 'https://mandapam-backend-97mi.onrender.com/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const createAuthInstance = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const memberApi = {
  // Get all members with filtering and pagination
  getMembers: async (params = {}) => {
    try {
      console.log('MemberApi - Sending params:', params);
      const instance = createAuthInstance();
      const response = await instance.get('/members', { params });
      console.log('MemberApi - Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching members:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Get single member by ID
  getMember: async (id) => {
    try {
      const instance = createAuthInstance();
      const response = await instance.get(`/members/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching member:', error);
      throw error;
    }
  },

  // Get members by association ID
  getAssociationMembers: async (associationId, params = {}) => {
    try {
      console.log('MemberApi - Getting association members for ID:', associationId);
      console.log('MemberApi - Sending params:', params);
      const instance = createAuthInstance();
      const response = await instance.get(`/associations/${associationId}/members`, { params });
      console.log('MemberApi - Association members response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching association members:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Create new member
  createMember: async (memberData) => {
    try {
      console.log('Member API - Sending data:', memberData);
      console.log('Member API - Request URL:', `${API_BASE_URL}/members`);
      
      const instance = createAuthInstance();
      const response = await instance.post('/members', memberData);
      console.log('Member API - Success response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Member API - Error creating member:', error);
      console.error('Member API - Error response:', error.response?.data);
      console.error('Member API - Error status:', error.response?.status);
      console.error('Member API - Error headers:', error.response?.headers);
      
      // Log detailed validation errors
      if (error.response?.data?.errors) {
        console.error('Member API - Validation errors:', error.response.data.errors);
        error.response.data.errors.forEach((err, index) => {
          console.error(`Member API - Error ${index + 1}:`, err);
        });
      }
      
      throw error;
    }
  },

  // Update existing member
  updateMember: async (id, memberData) => {
    try {
      const instance = createAuthInstance();
      const response = await instance.put(`/members/${id}`, memberData);
      return response.data;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },

  // Delete member
  deleteMember: async (id) => {
    try {
      const instance = createAuthInstance();
      const response = await instance.delete(`/members/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  },

  // Get member statistics
  getMemberStats: async () => {
    try {
      const instance = createAuthInstance();
      const response = await instance.get('/members/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching member stats:', error);
      throw error;
    }
  },

  // Update member status
  updateMemberStatus: async (id, status) => {
    try {
      const instance = createAuthInstance();
      const response = await instance.put(`/members/${id}/toggle-status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating member status:', error);
      throw error;
    }
  },

  // Update member dues
  updateMemberDues: async (id, dues) => {
    try {
      const instance = createAuthInstance();
      const response = await instance.put(`/members/${id}/dues`, { dues });
      return response.data;
    } catch (error) {
      console.error('Error updating member dues:', error);
      throw error;
    }
  }
};








