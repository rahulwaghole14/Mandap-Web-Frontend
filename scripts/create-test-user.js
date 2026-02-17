#!/usr/bin/env node

// This script helps you create a test user for development
// You'll need to run this against your backend API

const testUser = {
  email: 'admin@test.com',
  password: 'admin123',
  name: 'Test Admin',
  role: 'admin'
};

console.log('🧪 Test User for Development:');
console.log('============================');
console.log(`Email: ${testUser.email}`);
console.log(`Password: ${testUser.password}`);
console.log(`Role: ${testUser.role}`);
console.log('');

console.log('📋 How to use:');
console.log('1. Make sure your backend is running on http://localhost:5000');
console.log('2. Go to http://localhost:3000/login');
console.log('3. Use the credentials above to log in');
console.log('');

console.log('🔧 Alternative - Create user via API:');
console.log('curl -X POST http://localhost:5000/api/auth/register \\');
console.log('  -H "Content-Type: application/json" \\');
console.log(`  -d '${JSON.stringify(testUser)}'`);
console.log('');

console.log('💡 If you need to create an admin user, check your backend documentation');
console.log('   for the admin setup script or initial user creation.');
