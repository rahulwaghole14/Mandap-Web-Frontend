#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up Development Environment...\n');

// Create .env.local file for development
const envContent = `# Development Environment Variables
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
VITE_APP_NAME=Mandap Association Platform
VITE_APP_VERSION=1.0.0
`;

try {
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Created .env.local file');
} catch (error) {
  console.log('⚠️  Could not create .env.local file (may already exist)');
}

// Update package.json scripts for development
const packageJsonPath = './package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add development scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'dev:local': 'VITE_API_URL=http://localhost:5000 npm run dev',
  'dev:prod': 'VITE_API_URL=https://mandapam-backend-97mi.onrender.com npm run dev',
  'dev:backend': 'cd ../mandap-backend && npm run dev',
  'dev:full': 'concurrently "npm run dev:backend" "npm run dev:local"'
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with development scripts');

console.log('\n🎯 Development Setup Complete!\n');

console.log('📋 Available Commands:');
console.log('  npm run dev:local     - Start frontend with local backend');
console.log('  npm run dev:prod      - Start frontend with production backend');
console.log('  npm run dev:backend   - Start backend server only');
console.log('  npm run dev:full      - Start both frontend and backend');

console.log('\n🔧 Next Steps:');
console.log('1. Start your local backend server on port 5000');
console.log('2. Run: npm run dev:local');
console.log('3. Your app will be available at http://localhost:3000');

console.log('\n💡 Tips:');
console.log('- Make sure your backend is running on http://localhost:5000');
console.log('- Check the browser console for any CORS errors');
console.log('- Use the browser dev tools to debug API calls');
