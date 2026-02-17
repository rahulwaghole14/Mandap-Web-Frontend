# BOD & NBOD Backend Changes Documentation

## Overview
This document outlines the required changes to properly handle Board of Directors (BOD) and National Board of Directors (NBOD) functionality in the backend.

## Key Changes Required

### 1. BOD Model Updates (`mandapam-backend/models/BOD.js`)

**CRITICAL CHANGE:** Make `associationId` optional for National BODs

```javascript
// BEFORE (causing issues):
associationId: {
  type: DataTypes.INTEGER,
  allowNull: false, // Required for all BODs
  field: 'association_id',
  references: {
    model: 'associations',
    key: 'id'
  }
}

// AFTER (fixed):
associationId: {
  type: DataTypes.INTEGER,
  allowNull: true, // Made optional for National BODs
  field: 'association_id',
  references: {
    model: 'associations',
    key: 'id'
  }
}
```

### 2. BOD Routes Updates (`mandapam-backend/routes/bodRoutes.js`)

**CRITICAL CHANGE:** Handle `associationId` properly in POST route

```javascript
// BEFORE (in POST route):
const bod = await BOD.create(req.body);

// AFTER (fixed):
// Prepare BOD data
const bodData = {
  ...req.body,
  // For National BODs, associationId should be null
  // For Association BODs, associationId should be provided
  associationId: req.body.associationId || null
};

console.log('Creating BOD with data:', bodData);

// Create BOD member
const bod = await BOD.create(bodData);
```

## API Behavior Changes

### Association BOD Creation
- **Route:** `POST /api/bod`
- **Required Fields:** `associationId` must be provided
- **Source:** Created from Association Members detail page
- **Scope:** Local to specific association

**Example Request Body:**
```json
{
  "name": "John Doe",
  "position": "President",
  "phone": "9876543210",
  "email": "john@association.com",
  "bio": "Association BOD member",
  "isActive": true,
  "associationId": 7,
  "address": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

### National BOD Creation
- **Route:** `POST /api/bod`
- **Required Fields:** `associationId` should be `null` or omitted
- **Source:** Created from NBOD page in navigation
- **Scope:** National/Global level

**Example Request Body:**
```json
{
  "name": "Jane Smith",
  "position": "President",
  "phone": "9876543211",
  "email": "jane@mandap.com",
  "bio": "National BOD member",
  "isActive": true,
  "address": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

## Database Schema Impact

### BOD Table Structure
```sql
-- The association_id column should allow NULL values
ALTER TABLE board_of_directors 
MODIFY COLUMN association_id INT NULL;

-- Add index for better query performance
CREATE INDEX idx_bod_association_id ON board_of_directors(association_id);
```

## Validation Updates

### BOD Creation Validation
The existing validation in `bodRoutes.js` should remain the same, but ensure:

1. **Designation validation** includes only these values:
   - 'President'
   - 'Vice President' 
   - 'Secretary'
   - 'Joint Secretary'
   - 'Treasurer'
   - 'Joint Treasurer'
   - 'Executive Member'

2. **Remove 'Member'** from allowed designations (if present)

## Frontend Integration Points

### Association BOD Manager
- **File:** `src/components/AssociationBODManager.jsx`
- **Behavior:** Always includes `associationId: association.id` in request

### National BOD Manager  
- **File:** `src/pages/BODList.jsx`
- **Behavior:** Never includes `associationId` in request

## Testing Scenarios

### Test Case 1: Association BOD Creation
```bash
POST /api/bod
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Test Association BOD",
  "position": "President",
  "phone": "9876543210",
  "email": "test@association.com",
  "associationId": 7
}
```

**Expected Result:** BOD created with `associationId: 7`

### Test Case 2: National BOD Creation
```bash
POST /api/bod
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Test National BOD",
  "position": "President", 
  "phone": "9876543211",
  "email": "test@national.com"
}
```

**Expected Result:** BOD created with `associationId: null`

### Test Case 3: BOD Retrieval
```bash
GET /api/bod
Authorization: Bearer <token>
```

**Expected Result:** Returns both Association BODs and National BODs

## Migration Script (if needed)

```javascript
// Optional: Update existing BOD records
// Run this only if you have existing BOD data that needs migration

const updateExistingBODs = async () => {
  try {
    // If you have existing BODs that should be National BODs,
    // set their associationId to null
    await BOD.update(
      { associationId: null },
      { 
        where: { 
          // Add your criteria here for National BODs
          // For example: specific IDs or other conditions
        }
      }
    );
    
    console.log('BOD migration completed');
  } catch (error) {
    console.error('BOD migration failed:', error);
  }
};
```

## Rollback Plan

If issues occur, you can rollback by:

1. **Revert Model Change:**
```javascript
// In BOD.js model
associationId: {
  type: DataTypes.INTEGER,
  allowNull: false, // Revert to required
  field: 'association_id',
  references: {
    model: 'associations',
    key: 'id'
  }
}
```

2. **Revert Route Change:**
```javascript
// In bodRoutes.js POST route
const bod = await BOD.create(req.body);
```

## Summary

The key changes are:
1. ✅ Make `associationId` optional in BOD model
2. ✅ Handle `associationId` properly in POST route
3. ✅ Ensure proper validation for designations
4. ✅ Test both Association and National BOD creation

These changes will allow the same API endpoint to handle both Association BODs (with `associationId`) and National BODs (without `associationId`) seamlessly.

---

**Contact:** Frontend Team  
**Date:** $(date)  
**Priority:** High - Required for BOD functionality to work properly
