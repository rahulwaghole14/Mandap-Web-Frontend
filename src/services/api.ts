import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { User, Association, Event, Notification, BODMember, MemberSearchFilters } from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (mobile: string, otp: string) => 
    api.post('/auth/login', { mobile, otp }),
  
  register: (userData: Partial<User>) => 
    api.post('/auth/register', userData),
  
  verifyOTP: (mobile: string, otp: string) => 
    api.post('/auth/verify-otp', { mobile, otp }),
  
  resendOTP: (mobile: string) => 
    api.post('/auth/resend-otp', { mobile }),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  
  updateProfile: (userData: Partial<User>) => 
    api.put('/users/profile', userData),
  
  uploadProfileImage: (imageFile: FormData) => 
    api.post('/users/profile-image', imageFile, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// Member APIs
export const memberAPI = {
  searchMembers: (filters: MemberSearchFilters) => 
    api.get('/members/search', { params: filters }),
  
  getMemberProfile: (id: string) => 
    api.get(`/members/${id}`),
  
  getMembersByAssociation: (associationName: string) => 
    api.get(`/members/association/${associationName}`),
};

// Association APIs
export const associationAPI = {
  getAll: () => api.get('/associations'),
  
  getById: (id: string) => api.get(`/associations/${id}`),
  
  getByDistrict: (district: string) => 
    api.get(`/associations/district/${district}`),
};

// Event APIs
export const eventAPI = {
  getAll: () => api.get('/events'),
  
  getById: (id: string) => api.get(`/events/${id}`),
  
  getUpcoming: () => api.get('/events/upcoming'),
  
  registerForEvent: (eventId: string) => 
    api.post(`/events/${eventId}/register`),
  
  unregisterFromEvent: (eventId: string) => 
    api.delete(`/events/${eventId}/register`),
};

// Notification APIs
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  
  markAsRead: (id: string) => 
    api.put(`/notifications/${id}/read`),
  
  markAllAsRead: () => 
    api.put('/notifications/mark-all-read'),
  
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// BOD APIs
export const bodAPI = {
  getBOD: (associationName?: string) => 
    api.get('/bod', { params: { type: 'BOD', associationName } }),
  
  getNBOD: (associationName?: string) => 
    api.get('/bod', { params: { type: 'NBOD', associationName } }),
};

export default api;

