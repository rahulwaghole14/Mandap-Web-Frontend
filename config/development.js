// Development Configuration
export const developmentConfig = {
  // API Configuration
  API_BASE_URL: 'http://localhost:5000',
  
  // Development Settings
  DEBUG: true,
  LOG_LEVEL: 'debug',
  
  // CORS Settings for Development
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
  ],
  
  // File Upload Settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  
  // Database Settings (for backend)
  DATABASE: {
    HOST: 'localhost',
    PORT: 5432,
    NAME: 'mandap_dev',
    USER: 'postgres',
    PASSWORD: 'password'
  }
};

// Environment Variables for Development
export const devEnvVars = {
  VITE_API_URL: 'http://localhost:5000',
  VITE_NODE_ENV: 'development',
  VITE_DEBUG: 'true',
  VITE_LOG_LEVEL: 'debug'
};