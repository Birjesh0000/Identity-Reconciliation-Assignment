# Identity Reconciliation - Bitespeed Backend

A production-ready Node.js Express backend service for identifying and reconciling customer identities across multiple purchases using MongoDB.

**Status**: ✅ Production Ready | **Version**: 1.0.0 | **Stack**: Node.js, Express.js, MongoDB + Mongoose

---

## 🎯 Project Overview

This backend service solves the identity reconciliation problem for FluxKart's e-commerce platform. When customers make multiple purchases using different email addresses and phone numbers, this service intelligently:

- **Identifies** whether incoming contacts already exist in the system
- **Links** contacts that belong to the same person  
- **Consolidates** all information into a unified customer profile
- **Maintains** primary/secondary relationship to track contact hierarchy

> **Real-world example**: Dr. Emmett Brown places orders using different emails/phones for his time machine project. Our service recognizes these are all the same person across purchases.

---

## ✨ Features

- ✅ **Contact Identification** - Find and link contacts by email or phone number
- ✅ **Smart Merging** - Automatically merges contact groups when common data exists
- ✅ **Primary/Secondary Logic** - Oldest contact is primary, newer ones are secondary
- ✅ **Data Consolidation** - Aggregates all emails/phones for a customer profile
- ✅ **Input Validation** - Comprehensive validation with email/phone sanitization
- ✅ **Error Handling** - Structured error handling with meaningful messages
- ✅ **Logging** - Environment-aware logging for debugging
- ✅ **Edge Cases** - Handles cross-group merging, duplicates, and partial data
- ✅ **MongoDB** - Schema-based persistence with Mongoose ODM

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **Node.js** v14+ ([Download](https://nodejs.org/))
- **MongoDB** v4.0+ ([Local](https://www.mongodb.com/try/download/community), [Atlas](https://www.mongodb.com/cloud/atlas), or [Docker](https://hub.docker.com/_/mongo))

### Setup
```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/Identity-Reconciliation-Assignment.git
cd Identity-Reconciliation-Assignment

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env and add your MongoDB URI:
# MONGODB_URI=mongodb://localhost:27017/identity-reconciliation

# 5. Start server
npm run dev

# 6. Test endpoint
curl -X POST http://localhost:8000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","phoneNumber":"9191919191"}'
```

Expected response:
```json
{
  "contact": {
    "primaryContatctId": "507f1f77bcf86cd799439011",
    "emails": ["user@example.com"],
    "phoneNumbers": ["9191919191"],
    "secondaryContactIds": []
  }
}
```

---

## 📦 Installation & Setup

### Step 1: Install Prerequisites

**Windows:**
- Download Node.js from [nodejs.org](https://nodejs.org/) and run installer
- Download MongoDB from [mongodb.com/community](https://www.mongodb.com/try/download/community) and run installer

**macOS (Homebrew):**
```bash
brew install node mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install nodejs npm mongodb
sudo systemctl start mongodb
```

### Step 2: Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/Identity-Reconciliation-Assignment.git
cd Identity-Reconciliation-Assignment
npm install
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your MongoDB connection:

**Option 1: Local MongoDB**
```env
MONGODB_URI=mongodb://localhost:27017/identity-reconciliation
PORT=8000
NODE_ENV=development
```

**Option 2: MongoDB Atlas (Cloud)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/identity-reconciliation
PORT=8000
NODE_ENV=development
```

**Option 3: Docker MongoDB**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
# Then use: MONGODB_URI=mongodb://localhost:27017/identity-reconciliation
```

### Step 4: Verify MongoDB

Ensure MongoDB is running:
```bash
# Windows: Check Services app for "MongoDB Server"
# macOS/Linux:
mongod  # or brew services info mongodb-community
```

### Step 5: Start Server

```bash
# Development (auto-reload on changes)
npm run dev

# Production
npm start
```

Success indicator:
```
[timestamp] INFO: Server is running on port 8000
[timestamp] INFO: Environment: development
MongoDB connected: localhost:27017
```

---

## 📡 API Documentation

### POST `/api/identify`

**Purpose**: Identify and reconcile contacts, returning consolidated customer profile

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body (at least one field required):**
```json
{
  "email": "customer@example.com",
  "phoneNumber": "9191919191"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | optional | Valid email (max 255 chars) |
| `phoneNumber` | string | optional | 5-20 chars, digits/spaces/+/-/() |

#### Response (200 - Success)

```json
{
  "contact": {
    "primaryContatctId": "507f1f77bcf86cd799439011",
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["9191919191", "9192929292"],
    "secondaryContactIds": ["507f1f77bcf86cd799439012"]
  }
}
```

**Response Field Details:**
- `primaryContatctId`: MongoDB ObjectId of the primary contact (oldest)
- `emails`: Array of all emails, primary's email first
- `phoneNumbers`: Array of all phone numbers, primary's number first
- `secondaryContactIds`: All secondary contacts linked to primary

#### Response (400 - Validation Error)

```json
{
  "error": "At least one valid email or phoneNumber is required"
}
```

#### Response (500 - Server Error)

```json
{
  "error": "Internal Server Error",
  "details": "MongoDB connection failed"
}
```

---

## 💡 Usage Examples

### Example 1: New Customer

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

### Example 2: Existing Contact + New Email

**Setup:**
- Existing: `{email: "john@example.com", phone: "9191919191"}`

**Request:**
```bash
curl -X POST http://localhost:8000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"johnny@example.com","phoneNumber":"9191919191"}'
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": "60d5ec49abc123def4567890",
    "emails": ["john@example.com", "johnny@example.com"],
    "phoneNumbers": ["9191919191"],
    "secondaryContactIds": ["60d5ec49abc123def4567891"]
  }
}
```

### Example 3: Cross-Group Merging

**Setup:**
- Group A: `{email: "john@example.com", phone: "9191919191"}`
- Group B: `{email: "jane@example.com", phone: "9292929292"}`

**Request:** (John's email + Jane's phone)
```bash
curl -X POST http://localhost:8000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","phoneNumber":"9292929292"}'
```

**Result:** Groups merge, oldest primary remains primary

### Example 4: Only Email

```bash
curl -X POST http://localhost:8000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Example 5: Only Phone

```bash
curl -X POST http://localhost:8000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9191919191"}'
```

---

## 🏗️ Project Structure

```
Identity-Reconciliation-Assignment/
├── src/
│   ├── config/
│   │   └── database.js              # MongoDB connection setup
│   ├── middleware/
│   │   └── errorMiddleware.js       # Global error handler
│   ├── models/
│   │   └── Contact.js               # Mongoose contact schema
│   ├── routes/
│   │   ├── index.js                 # Route aggregator
│   │   └── identify.js              # POST /api/identify endpoint
│   ├── services/
│   │   └── identifyService.js       # Business logic & orchestration
│   ├── utils/
│   │   ├── validation.js            # Input validation & sanitization
│   │   ├── errors.js                # Custom error classes
│   │   └── logger.js                # Structured logging
│   └── server.js                    # Express app entry point
├── .env.example                     # Environment template
├── .gitignore
├── package.json
└── README.md                        # This file
```

---

## 📊 Database Schema

**Contact Model:**
```javascript
{
  _id: ObjectId,                      // Unique contact ID
  email: String,                      // Customer email
  phoneNumber: String,                // Customer phone
  linkedId: ObjectId,                 // Reference to primary contact
  linkPrecedence: "primary"|"secondary", // Link type
  createdAt: Date,                    // Creation timestamp
  updatedAt: Date,                    // Last update timestamp
  deletedAt: Date                     // Soft delete flag
}
```

---

## 🔐 Business Logic

### Contact Linking Rules

1. **Contacts link if they share**:
   - Same email address, OR
   - Same phone number

2. **Primary Contact**:
   - Oldest contact (lowest `createdAt`) is primary
   - Can be demoted to secondary if older contact discovered
   - Represents the original customer identification

3. **Secondary Contacts**:
   - Newer contacts default to secondary
   - Linked to primary via `linkedId` field
   - Multiple secondaries can link to one primary

4. **Cross-Group Merging**:
   - When email matches Group A and phone matches Group B
   - Groups automatically merge on request
   - Oldest contact across both groups becomes primary

5. **Contact Creation**:
   - No match → Create new primary contact
   - Match with new info → Create secondary link to primary
   - Exact duplicate → Return unchanged

---

## 🧪 Testing

### Using cURL

```bash
# Test 1: New contact
curl -X POST http://localhost:8000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","phoneNumber":"1234567890"}'

# Test 2: Validation error (missing both fields)
curl -X POST http://localhost:8000/api/identify \
  -H "Content-Type: application/json" \
  -d '{}'

# Test 3: Invalid email
curl -X POST http://localhost:8000/api/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","phoneNumber":"1234567890"}'
```

### Using Postman

1. Open Postman
2. Create new POST request to `http://localhost:8000/api/identify`
3. Set Headers: `Content-Type: application/json`
4. Set Body (raw JSON):
   ```json
   {"email":"test@example.com","phoneNumber":"9191919191"}
   ```
5. Click Send

### Testing Checklist

- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] POST with email and phone works
- [ ] POST with only email works
- [ ] POST with only phone works
- [ ] Invalid request returns 400 error
- [ ] Missing both fields returns validation error
- [ ] New contact creates primary
- [ ] Existing contact with new info creates secondary
- [ ] Cross-group merge works
- [ ] Response format matches spec exactly

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Port 8000 already in use** | Change PORT in .env or kill process using port |
| **Cannot connect to MongoDB** | Ensure MongoDB is running and MONGODB_URI in .env is correct |
| **"Module not found" error** | Run `npm install` |
| **MongoDB ECONNREFUSED** | Start MongoDB service |
| **Validation error on POST** | Ensure at least one valid email or phone in request |
| **Invalid email format** | Email must match standard format like user@domain.com |
| **Invalid phone format** | Phone must be 5-20 chars with digits/spaces/+/-/() |

### MongoDB Connection Troubleshooting

**Local MongoDB not starting?**
```bash
# Windows: Check Services > MongoDB Server
# macOS: brew services start mongodb-community  
# Linux: sudo systemctl start mongodb
```

**Atlas Connection Issues?**
- Verify username/password are correct
- Check IP is whitelisted in Atlas
- Ensure connection string: `mongodb+srv://user:pass@cluster.mongodb.net/db`

---

## 📈 Edge Cases Handled

✅ **Case 1**: Email from Group A, phone from Group B → Smart merge  
✅ **Case 2**: Exact duplicate contact → No duplicate created  
✅ **Case 3**: Only phone provided → Works correctly  
✅ **Case 4**: Only email provided → Works correctly  
✅ **Case 5**: Multiple primaries in same group → Newer becomes secondary  
✅ **Case 6**: Invalid data types → Proper validation + errors  
✅ **Case 7**: Primary contact turns secondary → Handled correctly  

---

## ⚙️ Configuration

### Environment Variables

**Server:**
```env
PORT=8000                    # Server port
NODE_ENV=development         # Environment mode
```

**Database:**
```env
MONGODB_URI=mongodb://localhost:27017/identity-reconciliation

# OR for Atlas:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

**Optional:**
```env
DEBUG=false                  # Enable debug logging
CORS_ORIGIN=*              # CORS allowed origins
```

---

## 🚀 Deployment

### Deploy to Render.com (Recommended - Free)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Go to [render.com](https://render.com)**
   - Sign up with GitHub
   - Create new Web Service
   - Connect repository
   - Set environment variables
   - Deploy!

3. **Update README** with live endpoint

### Alternative Hosting
- [Railway.app](https://railway.app)
- [Heroku](https://www.heroku.com)
- [AWS](https://amazonaws.com)
- [Google Cloud](https://cloud.google.com)

---

## 🔗 Tech Stack

| Tool | Purpose |
|------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework |
| **MongoDB** | Document database |
| **Mongoose** | ODM library |
| **dotenv** | Environment config |
| **CORS** | Cross-origin middleware |

---

## ✨ Development Stack

**Technologies Used:**
- Node.js with Express.js (Plain JavaScript)
- MongoDB with Mongoose ODM
- Dotenv for environment management
- Small, meaningful commits throughout development

---

**Status**: Production Ready ✅ | **Last Updated**: 2024
