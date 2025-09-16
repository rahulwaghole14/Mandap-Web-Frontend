# 🚀 Backend API Setup Guide

## Quick Start

### 1. Navigate to Backend Directory
```bash
cd mandapam-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mandapamDB
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=24h
```

### 4. Start the Server
**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Test Authentication
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mandap.com","password":"admin123"}'
```

### 3. Use Postman Collection
Import the `mandapam-postman-collection.json` file into Postman for comprehensive API testing.

## 📊 API Endpoints

- **Health**: `GET /health`
- **Auth**: `POST /api/auth/login`
- **Vendors**: `GET /api/vendors`
- **Events**: `GET /api/events`
- **BOD**: `GET /api/bod`
- **Members**: `GET /api/members`
- **Associations**: `GET /api/associations`

## 🔐 Demo Credentials

- **Admin**: admin@mandapam.com / admin123
- **Sub-Admin**: subadmin@mandapam.com / subadmin123
- **Demo**: demo@mandap.com / demo123

## 📚 Documentation

- **API Docs**: See `README.md` in the backend directory
- **Postman Collection**: `mandap-postman-collection.json`
- **Environment Variables**: `env.example`

---

**🎉 Your backend API is now ready for testing! 🎉**
















