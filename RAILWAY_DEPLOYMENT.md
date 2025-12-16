# 🚀 Railway + Vercel Deployment Guide

## Architecture Overview

```
Users → Vercel (Frontend) → Railway (Backend API) → Railway Postgres (Database)
```

---

## 📦 Part 1: Backend Deployment (Railway)

### Step 1: Prepare Backend

Your backend is ready in the `/backend` folder with:
- ✅ Express.js API
- ✅ Prisma ORM
- ✅ JWT Authentication
- ✅ Admin role-based access
- ✅ Professional history messages

### Step 2: Push Backend to GitHub

```bash
cd backend
git init
git add .
git commit -m "Initial backend setup"
git remote add origin https://github.com/yourusername/crypto-predict-backend.git
git push -u origin main
```

### Step 3: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your backend repository
5. Railway will auto-detect Node.js and install dependencies

### Step 4: Add Railway Postgres

1. Inside your project → Click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway automatically creates `DATABASE_URL` environment variable

### Step 5: Set Environment Variables

In Railway Dashboard → Your Service → Variables:

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=<generate-random-64-char-string>
FRONTEND_URL=https://your-app.vercel.app
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 6: Run Database Migrations

In Railway → Your Service → Settings → Deploy Logs:

Railway will automatically run:
```bash
npm install
npx prisma migrate deploy
npm run seed  # Creates admin user
npm start
```

Or manually via Railway CLI:
```bash
railway run npx prisma migrate deploy
railway run npm run seed
```

### Step 7: Get Your API URL

Railway provides: `https://your-service.up.railway.app`

Save this URL - you'll need it for frontend!

---

## 🌐 Part 2: Frontend Deployment (Vercel)

### Step 1: Update Frontend to Use API

Create `js/api-config.js`:

```javascript
export const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}
```

### Step 2: Push Frontend to GitHub

```bash
git add .
git commit -m "Add backend API integration"
git push origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your frontend repository
4. Configure project:
   - Framework Preset: **None** (static site)
   - Build Command: Leave empty
   - Output Directory: `.`

### Step 4: Set Environment Variables

In Vercel → Settings → Environment Variables:

```bash
VITE_API_URL=https://your-service.up.railway.app/api
VITE_ADMIN_EMAIL=admin@yourdomain.com
VITE_ADMIN_PASSWORD=your-admin-password
VITE_DEFAULT_USER_PASSWORD=demo123
VITE_ADMIN_PANEL_PASSWORD=admin-panel-pass
```

### Step 5: Deploy

Click **"Deploy"** - Vercel will build and deploy your site.

---

## 🌍 Part 3: Custom Domain Setup (Optional)

### For Frontend (Vercel)

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `app.yourdomain.com`
3. Add DNS records (Vercel provides instructions)
4. SSL automatically enabled

### For Backend (Railway)

1. Railway Dashboard → Your Service → Settings → Domains
2. Add custom domain: `api.yourdomain.com`
3. Add DNS records:
   ```
   Type: CNAME
   Name: api
   Value: your-service.up.railway.app
   ```
4. SSL automatically enabled

**Final URLs:**
- Frontend: `https://app.yourdomain.com`
- Backend: `https://api.yourdomain.com`

---

## 🔐 Part 4: Admin Access Control

### How It Works

1. **User logs in** → `POST /api/auth/login`
   - Returns JWT token with role
   
2. **Frontend stores token** → `localStorage.setItem('authToken', token)`

3. **Admin routes check role** → Backend verifies:
   ```javascript
   if (req.user.role !== 'ADMIN') {
     return res.status(403).json({ error: 'Admin access required' });
   }
   ```

4. **Frontend cannot bypass** → All admin actions go through backend

### Admin API Routes

```bash
# User Management
POST /api/admin/users/:userId/set-balance
POST /api/admin/users/:userId/inject-profit
POST /api/admin/users/:userId/freeze
POST /api/admin/users/:userId/kyc-lock
GET  /api/admin/users
GET  /api/admin/users/:userId

# Deposits
GET  /api/deposits/pending
POST /api/deposits/:depositId/confirm
POST /api/deposits/:depositId/reject

# Withdrawals
GET  /api/withdrawals/pending
POST /api/withdrawals/:withdrawalId/approve
POST /api/withdrawals/:withdrawalId/reject

# Support
GET  /api/support/all
PATCH /api/support/:ticketId/status
POST /api/support/:ticketId/reply

# Analytics
GET  /api/admin/analytics
GET  /api/admin/audit-logs

# Announcements
POST /api/announcements
DELETE /api/announcements/:id
```

---

## 📊 Part 5: Database Management

### View Database (Prisma Studio)

Locally:
```bash
cd backend
npx prisma studio
```

On Railway (via Railway CLI):
```bash
railway run npx prisma studio
```

### Create Admin Account Manually

```sql
-- Connect to Railway Postgres
INSERT INTO "User" (id, email, password, name, role, balance, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  '$2a$10$HASHED_PASSWORD_HERE',  -- Use bcrypt to hash
  'Admin',
  'ADMIN',
  0,
  NOW(),
  NOW()
);
```

Or use seed script:
```bash
railway run npm run seed
```

### Backup Database

Railway Dashboard → Postgres → Backups (automatic daily backups)

---

## 🧪 Part 6: Testing

### Test Backend API

```bash
# Health check
curl https://your-service.up.railway.app/health

# Register user
curl -X POST https://your-service.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User"}'

# Login
curl -X POST https://your-service.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Test Admin Access

```bash
# Get token from login response
TOKEN="your-jwt-token-here"

# Get all users (admin only)
curl https://your-service.up.railway.app/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Inject profit (admin only)
curl -X POST https://your-service.up.railway.app/api/admin/users/USER_ID/inject-profit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100}'
```

---

## 🔧 Part 7: Troubleshooting

### Backend Not Starting

Check Railway logs:
1. Railway Dashboard → Your Service → Deployments
2. Click latest deployment → View Logs
3. Look for errors in build/deploy logs

Common issues:
- Missing `DATABASE_URL` → Add Postgres plugin
- Missing `JWT_SECRET` → Add to environment variables
- Migration failed → Run `railway run npx prisma migrate deploy`

### Frontend Can't Connect to Backend

1. Check `VITE_API_URL` in Vercel environment variables
2. Check CORS settings in backend `server.js`:
   ```javascript
   cors({
     origin: process.env.FRONTEND_URL || '*'
   })
   ```
3. Verify Railway service is running

### Database Connection Issues

1. Verify `DATABASE_URL` exists in Railway variables
2. Check Prisma schema matches database
3. Run migrations: `railway run npx prisma migrate deploy`

---

## 📈 Part 8: Monitoring

### Railway

- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: History of all deployments

### Vercel

- **Analytics**: Page views, performance
- **Logs**: Function execution logs (if using serverless)
- **Deployment**: Build logs and status

### Database

- **Railway Postgres**: Automatic backups, metrics
- **Prisma Studio**: Visual database browser

---

## 🎯 Deployment Checklist

### Backend (Railway)
- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Admin user seeded
- [ ] API URL obtained
- [ ] Health check successful

### Frontend (Vercel)
- [ ] API integration code added
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Can connect to backend API
- [ ] Login/register working
- [ ] Admin panel accessible

### Testing
- [ ] User registration works
- [ ] User login works
- [ ] Deposits work
- [ ] Withdrawals work
- [ ] Admin can manage users
- [ ] Admin can approve deposits
- [ ] Admin can approve withdrawals
- [ ] History messages are professional

---

## 🚀 You're Live!

**Frontend**: `https://your-app.vercel.app`  
**Backend**: `https://your-service.up.railway.app`

**Admin Login**:
- Email: Set in `ADMIN_EMAIL`
- Password: Set in `ADMIN_PASSWORD`

**Demo Users** (if seeded):
- alice@test.local / demo123
- bob@test.local / demo123
- carol@test.local / demo123

---

## 📞 Support

**Railway**: [railway.app/help](https://railway.app/help)  
**Vercel**: [vercel.com/support](https://vercel.com/support)  
**Prisma**: [prisma.io/docs](https://prisma.io/docs)

**Need Help?** Check deployment logs first!
