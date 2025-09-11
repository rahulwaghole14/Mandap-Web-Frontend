# Backend Deployment Guide - BOD Validation Fix

## Quick Deployment Steps

### 1. Access the Backend Server
```bash
# SSH into your backend server or access the deployment platform
# (Render, Heroku, AWS, etc.)
```

### 2. Navigate to the Routes Directory
```bash
cd mandap-backend/routes
```

### 3. Edit the BOD Routes File
```bash
# Open the file for editing
nano bodRoutes.js
# or
vim bodRoutes.js
# or use your preferred editor
```

### 4. Apply the Fix
**Find lines 396-405** and replace with the fixed validation code from `BOD-Validation-Fix-URGENT.md`

**Find lines 521-530** and replace with the fixed validation code from `BOD-Validation-Fix-URGENT.md`

### 5. Save and Restart
```bash
# Save the file
# Restart the server
npm restart
# or
pm2 restart mandap-backend
# or restart your deployment platform
```

### 6. Test the Fix
```bash
# Run the test script
node test-bod-fix.js
```

## Alternative: Direct File Replacement

If you prefer to replace the entire file:

1. **Download the fixed file** from the frontend repository
2. **Replace** `mandap-backend/routes/bodRoutes.js` with the fixed version
3. **Restart** the server

## Verification Commands

### Quick Test (using curl)
```bash
# Test National BOD creation
curl -X POST https://mandapam-backend-97mi.onrender.com/api/bod \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test BOD",
    "position": "President",
    "phone": "9876543210",
    "email": "test@example.com",
    "isActive": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "bod": {
    "id": 123,
    "name": "Test BOD",
    "position": "President",
    "phone": "9876543210",
    "email": "test@example.com",
    "associationId": null,
    "isActive": true
  }
}
```

## Rollback Instructions

If something goes wrong:

1. **Revert the changes** to the original validation
2. **Restart the server**
3. **Contact the frontend team** for assistance

## Support

- **Frontend Team:** Available for immediate testing
- **Estimated Fix Time:** 5 minutes
- **Priority:** URGENT - Feature completely broken

---

**⚠️ This is a critical fix. Please apply immediately.**



