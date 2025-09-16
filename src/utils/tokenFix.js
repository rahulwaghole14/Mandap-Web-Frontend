// Token Fix Utility for Development
// This helps resolve JWT token issues when switching between environments

export const tokenFix = {
  // Clear all authentication data
  clearAllTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    console.log('✅ Cleared all authentication tokens');
  },

  // Check if token exists and is valid format
  validateToken: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found in localStorage');
      return false;
    }

    try {
      // Check if it's a valid JWT format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('❌ Invalid JWT format');
        return false;
      }

      // Try to decode the payload
      const payload = JSON.parse(atob(parts[1]));
      console.log('✅ Token format is valid');
      console.log('Token payload:', payload);
      return true;
    } catch (error) {
      console.log('❌ Token is corrupted or invalid:', error.message);
      return false;
    }
  },

  // Fix token issues by clearing and redirecting to login
  fixTokenIssues: () => {
    console.log('🔧 Fixing token issues...');
    
    // Clear all tokens
    tokenFix.clearAllTokens();
    
    // Clear axios default headers
    if (window.axios) {
      delete window.axios.defaults.headers.common['Authorization'];
    }
    
    // Redirect to login
    window.location.href = '/login';
  },

  // Auto-fix on page load
  autoFix: () => {
    const token = localStorage.getItem('token');
    if (token && !tokenFix.validateToken()) {
      console.log('🚨 Invalid token detected, auto-fixing...');
      tokenFix.fixTokenIssues();
    }
  }
};

// Auto-run token validation on import
if (typeof window !== 'undefined') {
  tokenFix.autoFix();
}