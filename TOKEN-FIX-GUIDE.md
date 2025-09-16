# JWT Token Fix Guide

## 🚨 Issue: "JsonWebTokenError: invalid signature"

This error occurs when the JWT token in your browser's localStorage is from a different backend (production vs development) or is corrupted.

## 🔧 Quick Fix Solutions

### **Option 1: Browser Console Fix (Fastest)**

1. **Open your browser's Developer Tools** (F12)
2. **Go to the Console tab**
3. **Run this command**:
   ```javascript
   localStorage.clear(); location.reload();
   ```
4. **This will clear all tokens and reload the page**

### **Option 2: Manual Clear**

1. **Open Developer Tools** (F12)
2. **Go to Application tab** → **Local Storage** → **http://localhost:3000**
3. **Delete the `token` key** (right-click → Delete)
4. **Refresh the page**

### **Option 3: Use the Token Fix Utility**

I've added a token fix utility to your Events page. It will automatically detect and fix token issues.

## 🎯 Root Cause

The issue happens because:
- You had a token from the production backend (`mandapam-backend-97mi.onrender.com`)
- Now you're using the development backend (`localhost:5000`)
- The JWT signatures don't match because they use different secret keys

## ✅ Prevention

To avoid this in the future:

1. **Always clear tokens when switching environments**:
   ```javascript
   localStorage.clear();
   ```

2. **Use the API switching script**:
   ```bash
   node scripts/switch-api.js development
   ```

3. **Check token validity**:
   ```javascript
   // In browser console
   const token = localStorage.getItem('token');
   console.log('Token exists:', !!token);
   ```

## 🚀 After Fixing

Once you clear the tokens:

1. **Go to the login page**: http://localhost:3000/login
2. **Use test credentials**:
   - Email: `admin@test.com`
   - Password: `admin123`
3. **Or create a new user** if needed

## 🔍 Debug Commands

Run these in your browser console to debug:

```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('token'));

// Check token format
const token = localStorage.getItem('token');
if (token) {
  const parts = token.split('.');
  console.log('Token parts:', parts.length);
  console.log('Token payload:', JSON.parse(atob(parts[1])));
}

// Clear all auth data
localStorage.removeItem('token');
localStorage.removeItem('authToken');
localStorage.removeItem('user');
```

## 📋 Quick Steps

1. **Clear tokens**: `localStorage.clear(); location.reload();`
2. **Go to login**: http://localhost:3000/login
3. **Login with test credentials**
4. **Test Events page**: http://localhost:3000/events

The token error should now be resolved! 🎉
