import axios from 'axios';

const API_BASE_URL = 'https://mandapam-backend-97mi.onrender.com/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

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

export const memberApi = {
  // Get all members with filtering and pagination
  getMembers: async (params = {}) => {
    try {
      const instance = createAuthInstance();
      const response = await instance.get('/members', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching members:', error);
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

  // Create new member
  createMember: async (memberData) => {
    try {
      const instance = createAuthInstance();
      const response = await instance.post('/members', memberData);
      return response.data;
    } catch (error) {
      console.error('Error creating member:', error);
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








