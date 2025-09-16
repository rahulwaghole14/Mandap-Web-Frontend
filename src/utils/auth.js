// Authentication utility functions

export const authUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get authentication token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Set authentication token
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Remove authentication token
  removeToken: () => {
    localStorage.removeItem('token');
  },

  // Check if token is valid (basic check)
  isTokenValid: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Basic JWT token validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  },

  // Get user info from token
  getUserFromToken: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  },

  // Clear all auth data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  }
};
