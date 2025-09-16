# CSV Import Backend Requirements

## Overview
This document outlines the backend requirements for implementing CSV import functionality for the Members page. The system should allow bulk import of member data with proper validation, error handling, and progress tracking.

## API Endpoint Specification

### Endpoint
```
POST /api/members/import-csv
```

### Authentication
- Requires valid JWT token
- Admin role required
- Apply existing `protect` and `authorize('admin')` middleware

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body Structure
```json
{
  "members": [
    {
      "name": "John Doe",
      "businessName": "ABC Mandap",
      "businessType": "mandap",
      "phone": "9876543210",
      "email": "john@example.com",
      "city": "Mumbai",
      "state": "Maharashtra",
      "district": "Mumbai",
      "associationName": "Mumbai Association",
      "birthDate": "1990-01-01",
      "address": "123 Main Street",
      "pincode": "400001",
      "gstNumber": "27ABCDE1234F1Z5",
      "description": "Professional mandap services",
      "experience": 5
    }
  ]
}
```

### Response Structure

#### Success Response
```json
{
  "success": true,
  "summary": {
    "total": 100,
    "imported": 95,
    "failed": 5,
    "skipped": 0
  },
  "errors": [
    {
      "row": 3,
      "data": {
        "name": "Invalid Member",
        "phone": "invalid-phone"
      },
      "errors": [
        "Invalid phone number format",
        "Association 'Non-existent Association' not found"
      ]
    }
  ],
  "warnings": [
    {
      "row": 10,
      "data": {
        "name": "Duplicate Member",
        "phone": "9876543210"
      },
      "message": "Member with this phone number already exists, skipped"
    }
  ],
  "importedMembers": [
    {
      "id": 123,
      "name": "John Doe",
      "businessName": "ABC Mandap",
      "phone": "9876543210"
    }
  ]
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Import failed",
  "errors": [
    {
      "type": "validation",
      "message": "Invalid request format"
    }
  ]
}
```

## Validation Requirements

### 1. Input Validation
- Validate request body structure
- Check for required fields: `name`, `businessName`, `businessType`, `phone`, `email`, `city`, `state`, `district`, `associationName`
- Validate data types and formats
- Check array length limits (max 1000 members per request)

### 2. Business Rule Validation
- **Phone Number**: Must be 10 digits, unique across all members
- **Email**: Valid email format, unique across all members
- **Business Type**: Must be one of: `['catering', 'sound', 'mandap', 'madap', 'light', 'decorator', 'photography', 'videography', 'transport', 'other']`
- **Birth Date**: Valid date format (YYYY-MM-DD), person must be at least 18 years old
- **GST Number**: Valid GST format if provided
- **Experience**: Must be between 0-100 years if provided

### 3. Association Validation
- Convert `associationName` to `associationId`
- Verify association exists and is active
- Handle case-insensitive matching
- Return specific error if association not found

### 4. Duplicate Detection
- Check for existing members by phone number
- Check for existing members by email
- Provide option to skip or update duplicates

## Database Operations

### 1. Transaction Management
- Use database transactions for batch operations
- Rollback entire batch if critical errors occur
- Commit successful records even if some fail

### 2. Batch Processing
- Process members in batches of 50
- Use `bulkCreate` for better performance
- Handle individual record failures gracefully

### 3. Association Lookup
```javascript
// Pseudo-code for association lookup
const associationMap = new Map();
for (const member of members) {
  if (!associationMap.has(member.associationName)) {
    const association = await Association.findOne({
      where: { 
        name: { [Op.iLike]: member.associationName },
        isActive: true 
      }
    });
    associationMap.set(member.associationName, association?.id || null);
  }
  member.associationId = associationMap.get(member.associationName);
}
```

## Error Handling Strategy

### 1. Validation Errors
- Collect all validation errors for each member
- Continue processing other members
- Return detailed error information with row numbers

### 2. Database Errors
- Handle unique constraint violations
- Handle foreign key constraint violations
- Provide meaningful error messages

### 3. System Errors
- Handle database connection issues
- Handle memory issues for large imports
- Implement proper logging

## Implementation Details

### 1. New Route File
Create `mandap-backend/routes/memberImportRoutes.js`:

```javascript
const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const memberImportService = require('../services/memberImportService');

const router = express.Router();

// Apply protection to all routes
router.use(protect);
router.use(authorize('admin'));

// CSV Import endpoint
router.post('/import-csv', [
  body('members').isArray({ min: 1, max: 1000 }).withMessage('Members must be an array with 1-1000 items'),
  body('members.*.name').notEmpty().withMessage('Name is required'),
  body('members.*.businessName').notEmpty().withMessage('Business name is required'),
  body('members.*.businessType').isIn(['catering', 'sound', 'mandap', 'madap', 'light', 'decorator', 'photography', 'videography', 'transport', 'other']).withMessage('Invalid business type'),
  body('members.*.phone').isMobilePhone('en-IN').withMessage('Invalid phone number'),
  body('members.*.email').isEmail().withMessage('Invalid email'),
  body('members.*.city').notEmpty().withMessage('City is required'),
  body('members.*.state').notEmpty().withMessage('State is required'),
  body('members.*.district').notEmpty().withMessage('District is required'),
  body('members.*.associationName').notEmpty().withMessage('Association name is required'),
  body('members.*.birthDate').optional().isISO8601().withMessage('Invalid birth date format'),
  body('members.*.gstNumber').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GST number format'),
  body('members.*.experience').optional().isInt({ min: 0, max: 100 }).withMessage('Experience must be between 0-100 years')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const result = await memberImportService.importMembers(req.body.members, req.user.id);
    
    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('CSV Import Error:', error);
    res.status(500).json({
      success: false,
      message: 'Import failed due to server error',
      error: error.message
    });
  }
});

module.exports = router;
```

### 2. Service Layer
Create `mandap-backend/services/memberImportService.js`:

```javascript
const { Member, Association } = require('../models');
const { Op } = require('sequelize');
const { validateBirthDate } = require('../utils/dateUtils');

class MemberImportService {
  async importMembers(members, createdBy) {
    const results = {
      summary: {
        total: members.length,
        imported: 0,
        failed: 0,
        skipped: 0
      },
      errors: [],
      warnings: [],
      importedMembers: []
    };

    // Build association lookup map
    const associationMap = await this.buildAssociationMap(members);
    
    // Check for duplicates
    const duplicateMap = await this.checkDuplicates(members);
    
    // Process members in batches
    const batchSize = 50;
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      await this.processBatch(batch, associationMap, duplicateMap, createdBy, results, i);
    }

    return results;
  }

  async buildAssociationMap(members) {
    const associationNames = [...new Set(members.map(m => m.associationName))];
    const associations = await Association.findAll({
      where: {
        name: { [Op.iLike]: { [Op.any]: associationNames } },
        isActive: true
      }
    });

    const map = new Map();
    associations.forEach(assoc => {
      map.set(assoc.name.toLowerCase(), assoc.id);
    });

    return map;
  }

  async checkDuplicates(members) {
    const phones = members.map(m => m.phone);
    const emails = members.map(m => m.email).filter(Boolean);
    
    const existingMembers = await Member.findAll({
      where: {
        [Op.or]: [
          { phone: { [Op.in]: phones } },
          { email: { [Op.in]: emails } }
        ]
      },
      attributes: ['phone', 'email']
    });

    const duplicateMap = new Map();
    existingMembers.forEach(member => {
      if (member.phone) duplicateMap.set(member.phone, 'phone');
      if (member.email) duplicateMap.set(member.email, 'email');
    });

    return duplicateMap;
  }

  async processBatch(batch, associationMap, duplicateMap, createdBy, results, startIndex) {
    const validMembers = [];
    const batchErrors = [];

    for (let i = 0; i < batch.length; i++) {
      const member = batch[i];
      const rowNumber = startIndex + i + 1;
      const errors = [];

      // Validate association
      const associationId = associationMap.get(member.associationName.toLowerCase());
      if (!associationId) {
        errors.push(`Association '${member.associationName}' not found`);
      }

      // Check duplicates
      if (duplicateMap.has(member.phone)) {
        results.warnings.push({
          row: rowNumber,
          data: { name: member.name, phone: member.phone },
          message: `Member with phone number ${member.phone} already exists, skipped`
        });
        results.summary.skipped++;
        continue;
      }

      if (member.email && duplicateMap.has(member.email)) {
        results.warnings.push({
          row: rowNumber,
          data: { name: member.name, email: member.email },
          message: `Member with email ${member.email} already exists, skipped`
        });
        results.summary.skipped++;
        continue;
      }

      // Validate birth date
      if (member.birthDate) {
        const birthDateValidation = validateBirthDate(member.birthDate);
        if (!birthDateValidation.isValid) {
          errors.push(birthDateValidation.message);
        }
      }

      if (errors.length > 0) {
        batchErrors.push({
          row: rowNumber,
          data: member,
          errors
        });
        results.summary.failed++;
      } else {
        validMembers.push({
          ...member,
          associationId,
          createdBy,
          isActive: true,
          isVerified: false,
          rating: '0.00',
          totalBookings: 0
        });
      }
    }

    // Add batch errors to results
    results.errors.push(...batchErrors);

    // Insert valid members
    if (validMembers.length > 0) {
      try {
        const insertedMembers = await Member.bulkCreate(validMembers, {
          returning: true,
          validate: true
        });
        
        results.importedMembers.push(...insertedMembers.map(m => ({
          id: m.id,
          name: m.name,
          businessName: m.businessName,
          phone: m.phone
        })));
        
        results.summary.imported += insertedMembers.length;
      } catch (error) {
        console.error('Batch insert error:', error);
        // Add all members in this batch as failed
        validMembers.forEach((member, index) => {
          results.errors.push({
            row: startIndex + index + 1,
            data: member,
            errors: ['Database insert failed: ' + error.message]
          });
        });
        results.summary.failed += validMembers.length;
        results.summary.imported -= validMembers.length;
      }
    }
  }
}

module.exports = new MemberImportService();
```

### 3. Route Registration
Add to `mandap-backend/server.js`:

```javascript
// Import routes
const memberImportRoutes = require('./routes/memberImportRoutes');

// Use routes
app.use('/api/members', memberImportRoutes);
```

## Testing Requirements

### 1. Unit Tests
- Test validation logic
- Test association lookup
- Test duplicate detection
- Test batch processing

### 2. Integration Tests
- Test complete import flow
- Test error handling
- Test transaction rollback
- Test performance with large datasets

### 3. Test Data
- Valid member data
- Invalid member data
- Duplicate member data
- Large dataset (1000+ members)
- Edge cases (empty fields, special characters)

## Performance Considerations

### 1. Batch Size
- Process in batches of 50 members
- Adjust based on server performance
- Monitor memory usage

### 2. Database Optimization
- Use bulk operations
- Index on phone and email fields
- Consider read replicas for association lookups

### 3. Memory Management
- Stream large CSV files
- Clear temporary data structures
- Monitor memory usage during import

## Security Considerations

### 1. Input Sanitization
- Sanitize all input data
- Prevent SQL injection
- Validate file uploads

### 2. Rate Limiting
- Implement rate limiting for import endpoint
- Limit concurrent imports
- Set maximum file size limits

### 3. Audit Logging
- Log all import attempts
- Track success/failure rates
- Monitor for suspicious activity

## Monitoring and Logging

### 1. Success Metrics
- Import success rate
- Processing time
- Records per second

### 2. Error Tracking
- Common validation errors
- Database errors
- Performance bottlenecks

### 3. Alerts
- High failure rates
- Long processing times
- System resource usage

## Future Enhancements

### 1. Async Processing
- Queue large imports
- Email notifications on completion
- Progress tracking via WebSocket

### 2. Template Management
- CSV template generation
- Field mapping configuration
- Custom validation rules

### 3. Advanced Features
- Update existing members
- Partial imports
- Import scheduling
- Data transformation rules

---

## Contact Information
For questions or clarifications regarding this specification, please contact the frontend development team.

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Ready for Implementation

