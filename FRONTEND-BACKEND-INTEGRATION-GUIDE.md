# Frontend-Backend Integration Guide

## 🎯 Overview
Your frontend has been updated to connect to the real backend API instead of using mock authentication. This guide will help you test the complete integration.

## 🚀 Quick Start

### 1. Start Your Backend Server
```bash
cd mandap-backend
npm run dev
```
You should see:
```
MongoDB Connected: ac-cuzccng-shard-00-XX.sdrnrmf.mongodb.net
🚀 Server running on port 5000
📊 Environment: development
🔗 Health check: http://localhost:5000/health
📚 API Documentation: http://localhost:5000/api
```

### 2. Create Your First Admin User
Run the setup script to create an admin user:
```bash
cd mandap-backend
node setup-admin.js
```

This will create:
- **Email**: admin@mandap.com
- **Password**: admin123
- **Role**: Admin
- **District**: Mumbai
- **State**: Maharashtra

### 3. Start Your Frontend
```bash
cd ..  # Go back to root directory
npm run dev
```

## 🔐 Authentication Flow

### Before (Mock System)
- ❌ Used hardcoded demo credentials
- ❌ Generated fake base64 tokens
- ❌ No real backend communication

### After (Real Backend)
- ✅ Connects to MongoDB Atlas database
- ✅ Uses real JWT tokens
- ✅ Full CRUD operations
- ✅ Secure password hashing
- ✅ Role-based permissions

## 🧪 Testing the Integration

### 1. Test Backend API
```bash
# Health check
curl http://localhost:5000/health

# API documentation
curl http://localhost:5000/api

# Create admin user
curl -X POST http://localhost:5000/api/auth/init-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@mandap.com",
    "password": "admin123",
    "district": "Mumbai",
    "state": "Maharashtra",
    "phone": "9876543210"
  }'
```

### 2. Test Frontend Login
1. Open your browser to the frontend (usually http://localhost:3001)
2. Go to the login page
3. Use the credentials created by the setup script:
   - **Email**: admin@mandap.com
   - **Password**: admin123
4. Click "Sign in"

### 3. Verify Authentication
- ✅ Should redirect to dashboard
- ✅ User info should display in sidebar
- ✅ JWT token should be stored in localStorage
- ✅ All protected routes should be accessible

## 🔧 Troubleshooting

### Common Issues

#### 1. "Network Error" during login
**Cause**: Backend server not running
**Solution**: 
```bash
cd mandap-backend
npm run dev
```

#### 2. "Invalid credentials" error
**Cause**: User doesn't exist in database
**Solution**: Run the setup script
```bash
cd mandap-backend
node setup-admin.js
```

#### 3. CORS errors
**Cause**: Frontend and backend ports mismatch
**Solution**: Check CORS configuration in `server.js` includes your frontend port

#### 4. MongoDB connection errors
**Cause**: Database connection issues
**Solution**: Check your `.env` file and MongoDB Atlas connection

### Debug Steps
1. Check browser console for errors
2. Check backend terminal for server logs
3. Verify MongoDB connection
4. Test API endpoints with curl/Postman

## 📱 Frontend Updates Made

### AuthContext.jsx
- ✅ Removed mock users
- ✅ Added real API calls
- ✅ Proper error handling
- ✅ JWT token management
- ✅ Profile management functions

### Login.jsx
- ✅ Removed demo credentials
- ✅ Added backend status info
- ✅ Better error messages
- ✅ Professional UI

### New Features
- ✅ Real-time backend status
- ✅ Proper authentication flow
- ✅ Secure token storage
- ✅ User profile management

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'admin' | 'sub-admin',
  district: String,
  state: String,
  phone: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Input validation
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers

## 📊 API Endpoints Available

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/init-admin` - Create initial admin
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### User Management (Admin Only)
- `GET /api/auth/users` - Get all users
- `POST /api/auth/users` - Create user
- `PUT /api/auth/users/:id` - Update user
- `DELETE /api/auth/users/:id` - Delete user

### Other Modules
- `GET /api/vendors` - Get vendors
- `GET /api/events` - Get events
- `GET /api/members` - Get members
- `GET /api/associations` - Get associations

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Backend**: MongoDB connected, server running on port 5000
2. **Frontend**: Login page with backend status indicators
3. **Authentication**: Successful login with real JWT token
4. **Dashboard**: Full access to all features
5. **Database**: User data stored in MongoDB Atlas

## 🚀 Next Steps

After successful integration:

1. **Create more users** through the admin panel
2. **Test all CRUD operations** for vendors, events, etc.
3. **Implement additional features** as per your requirements
4. **Deploy to production** when ready

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all services are running
3. Check browser console and backend logs
4. Ensure MongoDB Atlas is accessible

---

**🎯 Your Mandap Association Platform is now fully integrated with a real backend!**









