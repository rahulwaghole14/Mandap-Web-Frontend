# 📘 Mandapam Association Platform – Technical Specification

## 1. 📌 Project Overview
Mandapam Association is a vendor-only platform that connects wedding and event-related service providers across India. It includes:
- **Web Portal** (React)
- **Mobile Apps** (Android & iOS via React Native)
- **Admin + Sub-Admin Panel**
- **Association Member Registration**
- **Events & Announcements**
- **Membership Expiry Alerts**
- **No public-facing booking or inquiries**

## 2. 👥 User Roles
| Role        | Description |
|-------------|-------------|
| **Vendor**  | Wedding/Event service provider registering under Mandapam Association |
| **Admin**   | Super Admin managing all districts/states |
| **Sub-Admin** | Manages vendors within assigned districts or zones |

## 3. 📱 Platform Scope
| Platform      | Tech Stack         |
|---------------|--------------------|
| Web App       | React.js           |
| Mobile App    | React Native       |
| Backend       | Node.js + Express  |
| Database      | MongoDB (Mongoose) |
| File Storage  | AWS S3             |
| Notifications | Email (SMTP), WhatsApp (Twilio) |
| Hosting       | AWS EC2 + S3       |

## 4. 🧱 Core Modules

### 4.1 Vendor Registration
- Fields: Name, Business Name, Category, Phone, WhatsApp, Email, Address, City, District, State, Pincode, License (optional), Date of Joining
- Status: Pending / Approved / Rejected
- Uploaded by: Vendor or Admin

### 4.2 Admin/Sub-Admin Roles
- Admin: Manage all regions, vendors, events, payments
- Sub-Admin: Manage regional vendors, approvals, and uploads

### 4.3 Events & Announcements
- Title, Description, Event Date, Image/Video Upload
- Visible to all vendors in district

### 4.4 Membership Expiry Alerts
- Validity: 12 months
- Auto-reminders: 30-day & 7-day prior email/WhatsApp

### 4.5 Payments (Non-Transactional)

### 4.6 Board of Directors (BOD) Management
- Admin/Sub-Admin can:
  - Add new BOD members
  - Edit existing BOD information (name, role, contact)
  - Delete BOD entries

- Fields:
  - Full Name
  - Designation (President, Secretary, etc.)
  - Contact Number
  - Profile Image (optional)
  - Active Status (Yes/No)

- Displayed in BOD list section in app and admin portal

### BOD Schema (Mongoose)
```js
{
  name: String,
  designation: String,
  contactNumber: String,
  profileImage: String,
  isActive: { type: Boolean, default: true },
  addedBy: String, // Admin/Sub-admin ID
  createdAt: { type: Date, default: Date.now }
}
```

- For internal record keeping
- Fields: Amount, Mode, Date, Screenshot (optional)

## 5. 🌍 Filters & Search
- By State, District, City, Category, Name

## 6. 🧩 Data Models

### Vendor Schema (Mongoose)
```js
{
  name: String,
  businessName: String,
  category: String,
  contact: {
    phone: String,
    whatsapp: String,
    email: String
  },
  address: {
    city: String,
    district: String,
    state: String,
    pincode: String
  },
  licenseDoc: String,
  dateOfJoining: Date,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  addedBy: { type: String, enum: ['Admin', 'Vendor'], default: 'Vendor' },
  membershipExpiry: Date
}
```

### Announcement Schema
```js
{
  title: String,
  description: String,
  eventDate: Date,
  imageURL: String,
  videoURL: String,
  createdBy: String,
  district: String
}
```

## 7. 🔗 Suggested API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/vendor/register | Register a new vendor |
| GET | /api/vendor/list | List vendors with filters |
| PUT | /api/vendor/:id/status | Approve/Reject vendor |
| POST | /api/announcement/create | Admin post event |
| GET | /api/announcement/list | List all announcements |
| POST | /api/payment/add | Record payment |
| GET | /api/payment/list | View payments |
| POST | /api/notify/whatsapp | Send WhatsApp alert |
| POST | /api/notify/email | Send Email alert |

## 8. 🧪 Testing Instructions
- Use **Jest** for backend testing.
- Use **React Testing Library** for UI.
- Use prompts like:
  - “Write Jest tests for vendor registration API.”
  - “Test district filter functionality.”

## 9. 🚀 Deployment Plan
| Step | Tool | Notes |
|------|------|-------|
| Frontend | React (Vite) | Deploy via Vercel or S3 |
| Backend | Node.js + PM2 | Host on AWS EC2 |
| DB | MongoDB Atlas | Use secure connections |
| File Storage | AWS S3 | For videos/images |
| CI/CD | GitHub Actions | For deploy automation |
| Notifications | Twilio, Nodemailer | API keys in `.env` |

---

### 🔚 Use in Cursor AI
- Place this file in `/docs/mandapam.md`
- Use prompts like:
  - "Use `docs/mandapam.md` to generate vendor registration backend."
  - “Refer to announcement module and build upload UI in React Native.”

---

## 🔐 Authentication & Authorization

### Roles:
- **Admin**: Full access to all modules, data, users.
- **Sub-admin**: Limited to their region, can manage vendors/events within assigned districts.

### Auth APIs:
| Endpoint            | Method | Description                 | Auth Required | Body Params                   |
|---------------------|--------|-----------------------------|----------------|-------------------------------|
| `/api/auth/login`   | POST   | Admin/Sub-admin login       | ❌ No          | `email`, `password`           |
| `/api/auth/me`      | GET    | Get logged-in user profile  | ✅ Yes         | —                             |
| `/api/auth/logout`  | POST   | Logout                      | ✅ Yes         | —                             |

> ⚠️ All protected routes use JWT-based Auth in `Authorization: Bearer <token>` header.

---

## 🔧 Full REST API Reference

### 📦 Vendors (Mandapam Association Members)
| Endpoint              | Method | Description                 | Auth Required | Body Params                         |
|-----------------------|--------|-----------------------------|----------------|-------------------------------------|
| `/api/vendors`        | POST   | Add new vendor              | ✅ Yes         | `name`, `phone`, `city`, `image`, `membershipExpiry` |
| `/api/vendors`        | GET    | Get list of vendors         | ✅ Yes         | —                                   |
| `/api/vendors/:id`    | GET    | Get vendor details          | ✅ Yes         | —                                   |
| `/api/vendors/:id`    | PUT    | Update vendor info          | ✅ Yes         | Fields to update                    |
| `/api/vendors/:id`    | DELETE | Remove vendor               | ✅ Yes         | —                                   |

---

### 👥 Board of Directors (BOD)
| Endpoint              | Method | Description                 | Auth Required | Body Params              |
|-----------------------|--------|-----------------------------|----------------|--------------------------|
| `/api/bod`            | POST   | Add BOD entry               | ✅ Yes         | `name`, `designation`, `image` |
| `/api/bod`            | GET    | List all BOD members        | ✅ Yes         | —                        |
| `/api/bod/:id`        | PUT    | Update BOD entry            | ✅ Yes         | —                        |
| `/api/bod/:id`        | DELETE | Delete BOD member           | ✅ Yes         | —                        |

---

### 📆 Events / Announcements
| Endpoint              | Method | Description                 | Auth Required | Body Params              |
|-----------------------|--------|-----------------------------|----------------|--------------------------|
| `/api/events`         | POST   | Create event                | ✅ Yes         | `title`, `description`, `date` |
| `/api/events`         | GET    | List all events             | ✅ Yes         | —                        |
| `/api/events/:id`     | PUT    | Update event                | ✅ Yes         | —                        |
| `/api/events/:id`     | DELETE | Delete event                | ✅ Yes         | —                        |

---

### 📩 Notifications (Email/WhatsApp)
| Endpoint                     | Method | Description                        | Auth Required | Body Params                    |
|------------------------------|--------|------------------------------------|----------------|--------------------------------|
| `/api/notify/expiring`       | POST   | Notify vendors with soon-expiring memberships | ✅ Yes | —                      |
| `/api/notify/custom`         | POST   | Send custom message via email/WhatsApp | ✅ Yes | `vendorIds`, `message`    |

---

### 📁 File Uploads
| Endpoint            | Method | Description           | Auth Required | Body Params          |
|---------------------|--------|-----------------------|----------------|----------------------|
| `/api/upload/image` | POST   | Upload image file     | ✅ Yes         | `file` (multipart)   |

---

## 🔒 Error Format (Standard)
```json
{
  "success": false,
  "error": "Permission denied. Sub-admins cannot modify this record."
}
```

## 🧪 Testing Tooling
- Postman Collection (WIP)
- Jest for backend unit tests

