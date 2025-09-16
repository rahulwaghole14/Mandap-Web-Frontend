import React, { createContext, useContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults with backend URL
  useEffect(() => {
    // Set base URL for backend API
    axios.defaults.baseURL = API_BASE_URL.replace('/api', '');
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      try {
        // Handle real JWT token
        const decoded = jwtDecode(token);
        console.log('JWT Decoded:', decoded);
        
        if (decoded.exp * 1000 < Date.now()) {
          // Token expired
          logout();
        } else {
          setUser(decoded);
        }
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('Login attempt for:', email);
      
      // Call real backend API
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      console.log('Login successful:', userData);
      console.log('Token received:', newToken);
      console.log('User role:', userData.role);
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Debug: Check what's in localStorage
      console.log('Token stored in localStorage:', localStorage.getItem('token'));
      console.log('Current user state:', userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid input data.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if user is authenticated
      if (token) {
        await axios.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const getProfile = async () => {
    try {
      const response = await axios.get('/api/auth/profile');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get profile:', error);
      if (error.response?.status === 401) {
        logout();
      }
      return null;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/auth/profile', profileData);
      setUser(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update profile:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.put('/api/auth/password', {
        currentPassword,
        newPassword
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Failed to change password:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to change password' 
      };
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasPermission = (permission) => {
    if (!user) {
      return false;
    }
    
    // Admin has access to everything
    if (user.role === 'admin') {
      return true;
    }
    
    // Sub-admin permissions
    if (user.role === 'sub-admin') {
      const subAdminPermissions = [
        'vendors:read',
        'vendors:write',
        'events:read',
        'events:write',
        'bod:read',
        'bod:write',
        'members:read',
        'members:write'
      ];
      return subAdminPermissions.includes(permission);
    }
    
    return false;
  };

  const value = {
    user,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    isAuthenticated,
    hasRole,
    hasPermission,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
