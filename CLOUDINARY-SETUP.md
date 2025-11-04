# Cloudinary Integration Setup Guide

This guide explains how to set up Cloudinary for image uploads in the Mandapam Admin Panel.

## Prerequisites

1. A Cloudinary account (sign up at [cloudinary.com](https://cloudinary.com))
2. Access to your Cloudinary Dashboard

## Setup Steps

### 1. Get Your Cloudinary Cloud Name

1. Log in to your Cloudinary Dashboard
2. Your **Cloud Name** is displayed at the top of the dashboard
3. Note it down (e.g., `your-cloud-name`)

### 2. Create an Unsigned Upload Preset

For security, we use **unsigned uploads** with an upload preset. This allows frontend uploads without exposing your API secret.

1. In Cloudinary Dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets** section
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `mandap-unsigned` (or your preferred name)
   - **Signing mode**: Select **Unsigned**
   - **Folder**: Optional - set to `mandap-events` for organization
   - **Allowed formats**: Keep defaults or customize
   - **Transformation**: Optional - you can set default transformations here
5. Click **Save**

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory (or update existing one):

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=mandap-unsigned
```

**Important Notes:**
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Replace `your-cloud-name` with your actual Cloud Name
- Replace `mandap-unsigned` with your upload preset name
- For production, add these to your deployment platform's environment variables

### 4. Production Deployment

For production deployments (Netlify, Vercel, Render, etc.):

1. Go to your deployment platform's environment variables settings
2. Add:
   - `VITE_CLOUDINARY_CLOUD_NAME` = your cloud name
   - `VITE_CLOUDINARY_UPLOAD_PRESET` = your upload preset name
3. Redeploy your application

## Security Best Practices

✅ **DO:**
- Use unsigned upload presets for frontend uploads
- Store credentials in environment variables
- Use different presets for different folders (events, profiles, etc.)
- Set folder organization in upload presets
- Limit allowed formats in upload presets

❌ **DON'T:**
- Expose API Secret in frontend code
- Use signed uploads from frontend
- Commit `.env` files to git
- Hardcode credentials in source code

## How It Works

1. When an image is uploaded, the frontend sends it directly to Cloudinary using the unsigned upload preset
2. Cloudinary returns a secure URL that's stored in the database
3. Images are served directly from Cloudinary's CDN (fast and reliable)
4. Deletion requests are sent to the backend API (which handles the API secret securely)

## Testing

1. Start your development server: `npm run dev`
2. Try uploading an image in the Events form or Profile settings
3. Check the browser console for any errors
4. Verify the image appears correctly after upload

## Troubleshooting

### Upload fails with "Upload preset not found"
- Verify the upload preset name matches exactly (case-sensitive)
- Ensure the preset is set to "Unsigned"
- Check that the environment variable is set correctly

### Images not displaying
- Verify the Cloud Name is correct
- Check that uploaded URLs start with `https://res.cloudinary.com/`
- Ensure Cloudinary URL format is correct

### CORS errors
- Cloudinary handles CORS automatically for uploads
- If you see CORS errors, check your Cloudinary dashboard settings

## API Secret Usage

The API Secret (`99TaiXn9gMzzJd6_KT-l9EIQTyc`) should **ONLY** be used in your backend API for:
- Deleting images
- Server-side uploads
- Admin operations requiring authentication

**Never expose the API Secret in frontend code or environment variables that are accessible to the client.**
