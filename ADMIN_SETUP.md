# Admin Setup Guide

## ✅ How Admin Authentication Works

Your system uses **environment-based admin credentials** (NOT database records):

```
Environment Variables (Railway)
    ↓
Admin Login Endpoint
    ↓
JWT Token Generated
    ↓
Admin Access to All Routes
```

This is MORE SECURE than database records because credentials aren't stored in the database.

---

## 🔧 Required Environment Variables in Railway

Your backend needs these variables set in Railway:

| Variable | Example | Required |
|----------|---------|----------|
| `ADMIN_EMAIL` | `admin@example.com` | ✅ Yes |
| `ADMIN_PASSWORD` | `SecurePassword123` | ✅ Yes |
| `JWT_SECRET` | `your-32-char-random-secret` | ✅ Yes |
| `FRONTEND_URL` | `https://crypto-predict-ebon.vercel.app` | ✅ Yes (for CORS) |
| `DATABASE_URL` | (should already exist) | ✅ Yes |

---

## 📋 Steps to Configure Admin

### 1️⃣ Go to Railway Dashboard
- Visit: https://railway.app
- Select your `crypto-predict` project
- Click on the `crypto-predict-production-0b73` service

### 2️⃣ Go to Variables Tab
- Click "Variables" in the sidebar
- You should see `DATABASE_URL` already configured

### 3️⃣ Add Admin Credentials
Click "Add Variable" and add these:

**Variable 1:**
```
Name:  ADMIN_EMAIL
Value: your-admin-email@example.com
```

**Variable 2:**
```
Name:  ADMIN_PASSWORD
Value: your-secure-password-here
```

**Variable 3:**
```
Name:  JWT_SECRET
Value: your-secret-key-at-least-32-chars-long
```

**Variable 4:**
```
Name:  FRONTEND_URL
Value: https://crypto-predict-ebon.vercel.app
```

### 4️⃣ Redeploy
- Go to "Deployments" tab
- Click "Redeploy" on the latest deployment
- Wait for it to finish

---

## ✅ Verify It Works

After redeploy:

1. Go to: https://crypto-predict-ebon.vercel.app/admin/login.html
2. Enter your admin email and password
3. You should be logged in ✅

If still getting 500 errors:
- Check Railway logs in the "Logs" tab
- Look for the debug messages we added

---

## 🛡️ Security Tips

- Use a **strong, random password** (at least 16 characters)
- Use a **different email** than your user account
- Keep `JWT_SECRET` secret and random
- In production, use `HTTPS` only (Railway does this automatically)

---

## 🔍 Troubleshooting

If you still get 500 errors after setting these variables:

1. **Check Railway logs** for error messages
2. **Verify all 4 variables are set**
3. **Check the deployment actually redeployed** (look at timestamps)
4. **Clear browser cache** and try again

