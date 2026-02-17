# Deployment Guide for Mandapam UI Frontend

## Production Build

The application has been built for production and is ready for deployment.

### Build Output
- **Build Command**: `npm run build`
- **Output Directory**: `./dist`
- **Build Size**: ~643KB (gzipped: ~177KB)

### Render Deployment

1. **Connect Repository**: Connect your GitHub repository to Render
2. **Create Static Site**: Choose "Static Site" service type
3. **Configuration**:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Node Version**: 18.x or higher

### Environment Variables
- `NODE_ENV`: production
- `VITE_API_URL`: https://mandapam-backend-97mi.onrender.com/api (optional, already configured)

### Backend Integration
The frontend is configured to connect to the production backend:
- **Backend URL**: https://mandapam-backend-97mi.onrender.com
- **API Endpoints**: All API calls are configured to use the production server

### Features Included
- ✅ Dashboard with Performance Chart and Top Associations
- ✅ Member Management with Birth Date support
- ✅ Association Management
- ✅ Event Management
- ✅ BOD Management
- ✅ Vendor Management
- ✅ Authentication with JWT
- ✅ Responsive Design

### Security Headers
The application includes security headers for production:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Cache-Control for static assets

### Performance Notes
- Large bundle size warning (643KB) - consider code splitting for optimization
- All static assets are cached for 1 year
- Production build is optimized and minified
