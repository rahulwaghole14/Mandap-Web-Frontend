# Development Authentication Guide

## 🚨 Current Issue: 401 Unauthorized Error

You're getting `GET http://localhost:5000/api/events 401 (Unauthorized)` because the Events page requires authentication, but you're not logged in.

## 🔧 Solutions

### **Option 1: Login with Test Credentials (Recommended)**

1. **Start your backend server**:
   ```bash
   cd ../mandap-backend
   npm start
   ```

2. **Start your frontend**:
   ```bash
   npm run dev
   ```

3. **Go to the login page**:
   - Navigate to: http://localhost:3000/login
   - Use these test credentials:
     - **Email**: `admin@test.com`
     - **Password**: `admin123`

4. **After login, you can access Events**:
   - Navigate to: http://localhost:3000/events

### **Option 2: Create a Test User (If Option 1 doesn't work)**

If the test credentials don't work, you may need to create a user first:

```bash
# Create a test user via API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","name":"Test Admin","role":"admin"}'
```

### **Option 3: Use Backend Admin Setup (If available)**

Check if your backend has an admin setup script:

```bash
cd ../mandap-backend
node setup-admin.js
# or
npm run setup-admin
```

### **Option 4: Temporary Public Access (For Testing Only)**

I've already made the Events page temporarily public. You can now access it without login:

- Navigate to: http://localhost:3000/events

**⚠️ Note**: This removes authentication protection. Only use for development testing.

## 🔍 Debugging Steps

### 1. Check Backend Status
```bash
# Test if backend is running
curl http://localhost:5000/health
```

### 2. Check Authentication
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

### 3. Check Browser Console
- Open browser dev tools (F12)
- Check the Console tab for any errors
- Check the Network tab to see API requests

### 4. Check localStorage
- Open browser dev tools (F12)
- Go to Application tab → Local Storage
- Check if there's a `token` key

## 🛠️ Current Configuration

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Authentication**: JWT tokens stored in localStorage
- **Events Route**: Currently public (temporarily)

## 🔄 Restore Authentication (When Ready)

To restore authentication protection for Events:

```javascript
// In src/App.jsx, change this line:
<Route path="/events" element={<Events />} />

// Back to:
<Route path="/events" element={
  <ProtectedRoute requiredPermission="events:read">
    <Events />
  </ProtectedRoute>
} />
```

## 📋 Quick Commands

```bash
# Start backend
cd ../mandap-backend && npm start

# Start frontend
npm run dev

# Test backend health
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

## 🎯 Next Steps

1. **Choose one of the solutions above**
2. **Test the Events page**
3. **Try the gallery functionality**
4. **Restore authentication when ready**

The gallery system is ready to use once you resolve the authentication issue!
