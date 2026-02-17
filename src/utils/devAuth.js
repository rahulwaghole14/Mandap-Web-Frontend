// Development authentication helper
// This is only for development purposes

export const devAuth = {
  // Auto-login for development
  autoLogin: async () => {
    const testCredentials = {
      email: 'admin@test.com',
      password: 'admin123'
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCredentials)
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        console.log('✅ Auto-login successful for development');
        return true;
      } else {
        console.log('❌ Auto-login failed:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Auto-login error:', error);
      return false;
    }
  },

  // Check if we're in development mode
  isDevelopment: () => {
    return import.meta.env.DEV || window.location.hostname === 'localhost';
  },

  // Get test credentials
  getTestCredentials: () => {
    return {
      email: 'admin@test.com',
      password: 'admin123'
    };
  }
};
