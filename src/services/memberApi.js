import axios from 'axios';
import { API_BASE_URL } from '../constants';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const createAuthInstance = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers
  });
};

const createPublicInstance = () => {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const memberApi = {
  // Get all members with filtering and pagination
  getMembers: async (params = {}) => {
    try {
      console.log('MemberApi - Sending params:', params);
      const response = await createAuthInstance().get('/members', { params });
      console.log('MemberApi - Response:', response.data);
      
      // Debug: Check the structure of member data
      if (response.data.members && response.data.members.length > 0) {
        console.log('MemberApi - Sample member structure:', response.data.members[0]);
        console.log('MemberApi - Sample member keys:', Object.keys(response.data.members[0]));
        console.log('MemberApi - Sample member district:', response.data.members[0].district);
        console.log('MemberApi - Sample member city:', response.data.members[0].city);
        console.log('MemberApi - Sample member state:', response.data.members[0].state);
      }
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          console.log('MemberApi - Trying public access...');
          const response = await createPublicInstance().get('/members', { params });
          return response.data;
        } catch (publicError) {
          console.error('MemberApi - Public access also failed:', publicError);
          throw publicError;
        }
      }
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
      console.log('MemberApi - Updating member with ID:', id);
      console.log('MemberApi - Update data being sent:', memberData);
      console.log('MemberApi - District being sent:', memberData.district);
      
      const instance = createAuthInstance();
      const response = await instance.put(`/members/${id}`, memberData);
      
      console.log('MemberApi - Update response:', response.data);
      console.log('MemberApi - Updated member district:', response.data.member?.district);
      
      return response.data;
    } catch (error) {
      console.error('Error updating member:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
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








