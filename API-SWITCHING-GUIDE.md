# API Endpoint Switching Guide

## 🚀 Quick Switch Commands

### Switch to Development Mode
```bash
node scripts/switch-api.js development
```
- **API Endpoint**: `http://localhost:5000/api`
- **Use Case**: Local development with your backend server

### Switch to Production Mode
```bash
node scripts/switch-api.js production
```
- **API Endpoint**: `https://mandapam-backend-97mi.onrender.com/api`
- **Use Case**: Testing with production backend

## 📋 What Gets Updated

The script updates the `API_BASE_URL` constant in `src/constants/index.ts`, which is used by:

- ✅ `src/services/api.ts` (main API service)
- ✅ `src/services/eventApi.js`
- ✅ `src/services/uploadApi.js`
- ✅ `src/services/galleryApi.js`
- ✅ All other API services

## 🔧 Development Setup

### 1. Start Your Backend Server
```bash
# Navigate to your backend directory
cd ../mandap-backend

# Start the backend server
npm start
# or
node server.js
```

### 2. Switch to Development Mode
```bash
# In your frontend directory
node scripts/switch-api.js development
```

### 3. Start Your Frontend
```bash
npm run dev
```

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Image Uploads**: http://localhost:5000/uploads

## 🔍 Verification

After switching, you can verify the endpoint by:

1. **Check the constants file**:
   ```bash
   cat src/constants/index.ts | grep API_BASE_URL
   ```

2. **Check browser network tab**: Look for API calls to the correct endpoint

3. **Check console logs**: Any API errors will show the endpoint being used

## 🚨 Troubleshooting

### CORS Errors
If you get CORS errors in development:
1. Make sure your backend is running on port 5000
2. Check that your backend has CORS configured for `http://localhost:3000`
3. Verify the backend is accessible at `http://localhost:5000`

### Connection Refused
If you get connection refused errors:
1. Make sure your backend server is running
2. Check that it's running on port 5000
3. Verify no firewall is blocking the connection

### API Not Found
If you get 404 errors:
1. Make sure your backend has the gallery routes implemented
2. Check that the routes are mounted at `/api/gallery`
3. Verify the backend is serving the correct endpoints

## 📝 Notes

- The switch script only changes the frontend configuration
- You still need to run your backend server separately for development
- Image uploads will also use the local backend when in development mode
- The Vite proxy is configured to forward `/uploads` requests to the local backend

## 🔄 Quick Commands Summary

```bash
# Switch to development
node scripts/switch-api.js development

# Switch to production  
node scripts/switch-api.js production

# Start development server
npm run dev

# Check current endpoint
cat src/constants/index.ts | grep API_BASE_URL
```
