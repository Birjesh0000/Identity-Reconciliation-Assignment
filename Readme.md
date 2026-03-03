# Identity Reconciliation - Bitespeed Backend

A lightweight Node.js backend that identifies and links customer contacts across multiple purchases using MongoDB.

**Status**: ✅ Live | **Version**: 1.0.0 | **Stack**: Node.js, Express.js, MongoDB

---

## 📋 What It Does

When customers make purchases with different emails/phone numbers, this service:
- Identifies if contacts already exist
- Links contacts belonging to same person
- Consolidates all emails/phones into one profile
- Maintains primary (oldest) and secondary (newer) contacts

---

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- MongoDB (local, Docker, or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Setup (5 minutes)

```bash
# 1. Clone and install
git clone https://github.com/Birjesh0000/Identity-Reconciliation-Assignment.git
cd Identity-Reconciliation-Assignment
npm install

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with MongoDB URI
# Local: MONGODB_URI=mongodb://localhost:27017/identity-reconciliation
# Or Atlas: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# 4. Start server
npm run dev
```

Expected output:
```
Server is running on port 8000
Environment: development
MongoDB connected
```

---

## 📡 API Usage

### POST `/api/identify`

Identify and consolidate contacts.

**Request:**
```bash
curl -X POST http://localhost:8000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","phoneNumber":"9191919191"}'
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": "60d5ec49abc123def4567890",
    "emails": ["john@example.com"],
    "phoneNumbers": ["9191919191"],
    "secondaryContactIds": []
  }
}
```

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | optional | Valid email format |
| `phoneNumber` | string | optional | 5-20 chars (digits, spaces, +, -, ()) |

> At least one field required!

---

## 🧪 Test with Postman

### Quick Health Check (Test Server is Running)

Before testing the `/identify` endpoint, verify server is up:

**Method**: `GET`
**URL**: `http://localhost:8000/health`

**Expected 200 Response:**
```json
{"status":"OK","message":"Server is running"}
```

---

### Step 1: Open Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Open Postman and create new request

### Step 2: Configure Request

**Method**: `POST`
**URL**: `http://localhost:8000/api/identify`

**Headers Tab:**
```
Content-Type: application/json
```

**Body Tab (Select "raw" and "JSON"):**
```json
{
  "email": "john@example.com",
  "phoneNumber": "9191919191"
}
```

### Step 3: Send Request

Click **Send** button and check response

**Expected 200 Response:**
```json
{
  "contact": {
    "primaryContatctId": "60d5ec49abc123def4567890",
    "emails": ["john@example.com"],
    "phoneNumbers": ["9191919191"],
    "secondaryContactIds": []
  }
}
```

---

## 📝 Test Cases

### Test 1: New Contact
**Body:**
```json
{"email":"alice@example.com","phoneNumber":"9111111111"}
```
**Expected**: Creates primary contact with empty `secondaryContactIds`

### Test 2: Existing Contact with New Email
**Body (first request):**
```json
{"email":"bob@example.com","phoneNumber":"9222222222"}
```
**Body (second request):**
```json
{"email":"bob.new@example.com","phoneNumber":"9222222222"}
```
**Expected**: Secondary contact created, linked to primary

### Test 3: Cross-Group Merge
**Body (request 1):**
```json
{"email":"charlie@example.com","phoneNumber":"9333333333"}
```
**Body (request 2):**
```json
{"email":"diana@example.com","phoneNumber":"9444444444"}
```
**Body (request 3 - triggers merge):**
```json
{"email":"charlie@example.com","phoneNumber":"9444444444"}
```
**Expected**: Two groups merge, oldest stays primary

### Test 4: Validation Error (Missing Fields)
**Body:**
```json
{}
```
**Expected 400 Error:**
```json
{"error":"At least one valid email or phoneNumber is required"}
```

### Test 5: Invalid Email
**Body:**
```json
{"email":"invalid-email","phoneNumber":"9555555555"}
```
**Expected 400 Error:**
```json
{"error":"Invalid email format"}
```

---

## 📁 Project Structure

```
src/
├── config/database.js          # MongoDB connection
├── models/Contact.js           # Contact schema
├── routes/identify.js          # POST /api/identify endpoint
├── services/identifyService.js # Business logic
├── middleware/errorMiddleware.js # Error handling
├── utils/                      # Validation, logging, errors
└── server.js                   # Express app
```

---

## 🛠️ Development Scripts

```bash
npm start    # Production mode
npm run dev  # Development (auto-reload with nodemon)
```

---

## 🔧 Environment Setup

Create `.env` file:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/identity-reconciliation
PORT=8000
NODE_ENV=development

# OR MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/identity-reconciliation
PORT=8000
NODE_ENV=production
```

---

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| Port 8000 already in use | Change PORT in .env or kill process |
| MongoDB connection failed | Start MongoDB or check MONGODB_URI |
| Module not found | Run `npm install` |
| Invalid email/phone | Email must be valid, phone 5-20 chars |

### Start MongoDB

```bash
# Local (macOS/Linux)
mongod

# Docker
docker run -d -p 27017:27017 mongo:latest

# Windows
# Check Services app for "MongoDB Server"
```

---

## 🎯 Key Features

✅ Contact identification by email/phone
✅ Smart contact linking and merging
✅ Primary/secondary contact hierarchy
✅ Cross-group merging support
✅ Input validation & sanitization
✅ Structured error handling
✅ Environment-aware logging
✅ Rate limiting (100 req/15min)
✅ Security headers (Helmet)

---

## 📤 Deployment

### Deploy to Render.com (Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → Create Web Service
3. Connect your GitHub repo
4. Set environment variables (MONGODB_URI, NODE_ENV)
5. Deploy!

---

## 📊 Contact Model

```javascript
{
  _id: ObjectId,
  email: String,
  phoneNumber: String,
  linkedId: ObjectId,                    // Reference to primary
  linkPrecedence: "primary" | "secondary",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 💻 Tech Stack

- **Node.js** - Runtime
- **Express.js** - Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Helmet** - Security headers
- **CORS** - Cross-origin support

---

## ✅ Status

- API: ✅ Fully Functional
- Tests: ✅ Passing
- Deployment: ✅ Live on Render
- Documentation: ✅ Complete

---

**Live Backend**: https://identity-reconciliation-assignment.onrender.com

**GitHub**: https://github.com/Birjesh0000/Identity-Reconciliation-Assignment
