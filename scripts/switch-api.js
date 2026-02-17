#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const constantsPath = './src/constants/index.ts';

// API endpoints
const endpoints = {
  development: 'http://localhost:5000/api',
  production: 'https://mandapam-backend-97mi.onrender.com/api'
};

// Get the mode from command line argument
const mode = process.argv[2] || 'development';

if (!endpoints[mode]) {
  console.log('❌ Invalid mode. Use "development" or "production"');
  console.log('Usage: node scripts/switch-api.js [development|production]');
  process.exit(1);
}

try {
  // Read the constants file
  let content = fs.readFileSync(constantsPath, 'utf8');
  
  // Replace the API_BASE_URL
  content = content.replace(
    /export const API_BASE_URL = '[^']*';/,
    `export const API_BASE_URL = '${endpoints[mode]}';`
  );
  
  // Write back to file
  fs.writeFileSync(constantsPath, content);
  
  console.log(`✅ Switched to ${mode} mode`);
  console.log(`🔗 API Endpoint: ${endpoints[mode]}`);
  
  if (mode === 'development') {
    console.log('\n📋 Next Steps:');
    console.log('1. Make sure your backend is running on http://localhost:5000');
    console.log('2. Start your frontend: npm run dev');
    console.log('3. Your app will be available at http://localhost:3000');
  } else {
    console.log('\n📋 Next Steps:');
    console.log('1. Start your frontend: npm run dev');
    console.log('2. Your app will connect to the production backend');
  }
  
} catch (error) {
  console.error('❌ Error switching API endpoint:', error.message);
  process.exit(1);
}
