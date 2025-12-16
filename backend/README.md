# 24h Trading Platform - Backend API

Professional backend API for cryptocurrency trading platform.

## 🏗️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Auth**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcryptjs
- **Validation**: express-validator

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.js             # Seed data (admin + demo users)
├── middleware/
│   └── auth.js             # JWT authentication & role check
├── routes/
│   ├── auth.js             # Register, login, verify
│   ├── user.js             # User profile & history
│   ├── admin.js            # Admin user management
│   ├── deposit.js          # Deposit management
│   ├── withdrawal.js       # Withdrawal management
│   ├── support.js          # Support tickets
│   └── announcement.js     # Announcements
├── utils/
│   └── history.js          # Professional message formatter
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
└── server.js               # Main server file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/crypto_predict"
NODE_ENV=development
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:5500
ADMIN_EMAIL=admin@24htrading.com
ADMIN_PASSWORD=Admin!2024
```

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (creates admin + demo users)
npm run seed
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

---

## 📚 API Documentation

### Base URL
```
Local: http://localhost:3000/api
Production: https://your-service.up.railway.app/api
```

### Authentication

All authenticated routes require JWT token in header:
```
Authorization: Bearer <your-jwt-token>
```

---

### 🔓 Public Routes

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "balance": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

---

### 👤 User Routes (Authenticated)

#### Get Profile
```http
GET /api/user/profile
Authorization: Bearer <token>
```

#### Get History
```http
GET /api/user/history?limit=50&skip=0
Authorization: Bearer <token>
```

#### Update Profile
```http
PATCH /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name"
}
```

---

### 💰 Deposit Routes

#### Submit Deposit
```http
POST /api/deposits
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500,
  "network": "TRC20",
  "asset": "USDT",
  "walletAddress": "TXxx..."
}
```

#### Get My Deposits
```http
GET /api/deposits
Authorization: Bearer <token>
```

#### [ADMIN] Get Pending Deposits
```http
GET /api/deposits/pending
Authorization: Bearer <admin-token>
```

#### [ADMIN] Confirm Deposit
```http
POST /api/deposits/:depositId/confirm
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "amount": 500
}
```

#### [ADMIN] Reject Deposit
```http
POST /api/deposits/:depositId/reject
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Invalid payment"
}
```

---

### 💸 Withdrawal Routes

#### Request Withdrawal
```http
POST /api/withdrawals
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 250,
  "walletAddress": "TXxx...",
  "network": "TRC20"
}
```

#### Get My Withdrawals
```http
GET /api/withdrawals
Authorization: Bearer <token>
```

#### [ADMIN] Get Pending Withdrawals
```http
GET /api/withdrawals/pending
Authorization: Bearer <admin-token>
```

#### [ADMIN] Approve Withdrawal
```http
POST /api/withdrawals/:withdrawalId/approve
Authorization: Bearer <admin-token>
```

#### [ADMIN] Reject Withdrawal
```http
POST /api/withdrawals/:withdrawalId/reject
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Insufficient verification"
}
```

---

### 👑 Admin Routes (Admin Only)

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

#### Get User by ID
```http
GET /api/admin/users/:userId
Authorization: Bearer <admin-token>
```

#### Set User Balance
```http
POST /api/admin/users/:userId/set-balance
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "balance": 10000
}
```

#### Inject Profit
```http
POST /api/admin/users/:userId/inject-profit
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "amount": 500
}
```

#### Freeze/Unfreeze Account
```http
POST /api/admin/users/:userId/freeze
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "freeze": true
}
```

#### Toggle KYC Lock
```http
POST /api/admin/users/:userId/kyc-lock
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "lock": true
}
```

#### Get Platform Analytics
```http
GET /api/admin/analytics
Authorization: Bearer <admin-token>
```

#### Get Audit Logs
```http
GET /api/admin/audit-logs?limit=100&skip=0
Authorization: Bearer <admin-token>
```

---

### 🎫 Support Routes

#### Create Ticket
```http
POST /api/support
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Withdrawal issue",
  "message": "My withdrawal is stuck",
  "category": "withdrawal"
}
```

#### Get My Tickets
```http
GET /api/support
Authorization: Bearer <token>
```

#### [ADMIN] Get All Tickets
```http
GET /api/support/all?status=OPEN
Authorization: Bearer <admin-token>
```

#### [ADMIN] Update Ticket Status
```http
PATCH /api/support/:ticketId/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "RESOLVED"
}
```

#### [ADMIN] Add Reply
```http
POST /api/support/:ticketId/reply
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "message": "We're looking into this..."
}
```

---

### 📢 Announcement Routes

#### Get Announcements (Public)
```http
GET /api/announcements
```

#### [ADMIN] Create Announcement
```http
POST /api/announcements
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "System Maintenance",
  "content": "Scheduled maintenance on...",
  "type": "MAINTENANCE"
}
```

#### [ADMIN] Delete Announcement
```http
DELETE /api/announcements/:announcementId
Authorization: Bearer <admin-token>
```

---

## 🗄️ Database Schema

### User
- id, email, password (hashed), name, role (USER/ADMIN)
- balance, spotBalance, futuresBalance, optionsBalance
- frozen, kyc, kycLocked, vip
- createdAt, updatedAt, lastLoginAt

### History
- id, userId, action, message, meta (JSON)
- createdAt

### Deposit
- id, userId, amount, network, asset, walletAddress
- status (PENDING/CONFIRMED/REJECTED)
- confirmedAt, rejectedAt, rejectionReason
- createdAt, expiresAt

### Withdrawal
- id, userId, amount, walletAddress, network
- status (PENDING/APPROVED/REJECTED/COMPLETED)
- approvedAt, rejectedAt, rejectionReason
- createdAt

### SupportTicket
- id, userId, subject, message, category
- status (OPEN/IN_PROGRESS/RESOLVED/CLOSED)
- priority (LOW/MEDIUM/HIGH/URGENT)
- assignedTo, replies (JSON)
- createdAt, updatedAt, closedAt

### Announcement
- id, title, content, type (INFO/WARNING/MAINTENANCE/PROMOTION)
- createdAt, updatedAt

### AuditLog
- id, action, targetId, performedBy, details (JSON)
- createdAt

---

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt (10 rounds)
- ✅ **Role-Based Access** - Admin vs User permissions
- ✅ **Rate Limiting** - Prevent abuse
- ✅ **Helmet** - Security headers
- ✅ **CORS** - Controlled cross-origin requests
- ✅ **Input Validation** - express-validator
- ✅ **Audit Logging** - Track admin actions

---

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 📦 Deployment

See [RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md) for complete Railway deployment guide.

Quick Railway deployment:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add Postgres
railway add

# Deploy
railway up
```

---

## 🛠️ Development

### Database Management

```bash
# Prisma Studio (visual database browser)
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWTs
- `NODE_ENV` - development/production

Optional:
- `PORT` - Server port (default: 3000)
- `FRONTEND_URL` - Frontend URL for CORS
- `ADMIN_EMAIL` - Default admin email for seeding
- `ADMIN_PASSWORD` - Default admin password for seeding

---

## 📝 Notes

### Professional History Messages

All user actions are logged with professional messages:
- ✅ "Deposit completed - $500.00 credited to your account"
- ✅ "Trading profit - $100.00 earned"
- ✅ "Withdrawal approved - $250.00 will be sent shortly"

Admin actions are disguised as normal activities in user history.

### Admin Access

Only users with `role: 'ADMIN'` can access admin routes. Backend enforces this server-side.

### Security

- Passwords are bcrypt hashed (never stored plain text)
- JWT tokens expire in 7 days
- All admin actions are audit logged
- Rate limiting prevents API abuse

---

## 📄 License

MIT

---

**Built with ❤️ for 24h Trading Platform**
