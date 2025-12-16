# 🚀 Vercel Deployment Guide

## ⚠️ IMPORTANT: Security Setup Required

Before deploying to Vercel, you **MUST** configure environment variables to secure your application.

---

## 📋 Pre-Deployment Checklist

- [x] ✅ Removed all hardcoded credentials from codebase
- [x] ✅ Created `.gitignore` to exclude sensitive files
- [x] ✅ Created `.env.example` template
- [x] ✅ Created `vercel.json` configuration
- [ ] ⚠️ **YOU MUST:** Set environment variables in Vercel dashboard

---

## 🔐 Required Environment Variables

Set these in your Vercel project settings **before deploying**:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `VITE_ADMIN_EMAIL` | Admin login email | `admin@yourcompany.com` |
| `VITE_ADMIN_PASSWORD` | Admin login password | `YourSecurePassword123!` |
| `VITE_DEFAULT_USER_PASSWORD` | Demo user password | `DemoPass456!` |
| `VITE_ADMIN_PANEL_PASSWORD` | Admin panel access | `AdminPanel789!` |
| `VITE_SYSTEM_MODE` | System mode (optional) | `SIMULATION_ONLY` |

**⚠️ CRITICAL:** Use **strong, unique passwords** for each variable!

---

## 🚀 Deployment Steps

### 1. Push to GitHub (or GitLab/Bitbucket)

```bash
git add .
git commit -m "Security: Remove hardcoded credentials"
git push origin main
```

### 2. Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your repository
4. Vercel will auto-detect settings from `vercel.json`

### 3. Configure Environment Variables

**BEFORE** deploying, add environment variables:

1. Go to **Settings** → **Environment Variables**
2. Add each variable listed above
3. Set for: **Production**, **Preview**, and **Development**
4. Click **Save**

### 4. Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Visit your site URL
4. **Test admin login** at: `https://your-site.vercel.app/admin/login.html`

---

## 🧪 Testing After Deployment

### Test Admin Login
1. Visit `/admin/login.html`
2. Use the credentials you set in `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD`
3. Should successfully log in to admin panel

### Test Demo Users
1. Visit `/login.html`
2. Use demo emails: `alice@test.local`, `bob@test.local`, or `carol@test.local`
3. Password is what you set in `VITE_DEFAULT_USER_PASSWORD`

---

## 📁 Files That Are NOT Deployed

The following are excluded via `.gitignore`:

- `node_modules/` - Dependencies
- `.env` - Local environment variables
- Debug/test HTML files (`login-debug.html`, `test-*.html`, etc.)
- Documentation files (optional)

---

## 🔒 Security Best Practices

### ✅ What We Fixed
- ❌ Removed hardcoded admin password (`admin147568@AB`)
- ❌ Removed hardcoded admin email
- ❌ Removed hardcoded user passwords (`pass123`)
- ❌ Removed hardcoded admin panel password (`Admin!234`)
- ✅ All credentials now use environment variables
- ✅ Added `.gitignore` for sensitive files
- ✅ Added security headers in `vercel.json`

### ⚠️ Current Limitations
This is a **client-side simulation app**. For production use with real money:

1. **Use a backend server** (Node.js, Python, etc.)
2. **Never store credentials client-side**
3. **Implement proper authentication** (OAuth, JWT, etc.)
4. **Use a real database** (PostgreSQL, MongoDB, etc.)
5. **Add rate limiting** and CAPTCHA
6. **Enable HTTPS** (Vercel does this automatically)

### 🔐 Recommended Auth Services
For production, consider:
- [Supabase Auth](https://supabase.com/auth)
- [Firebase Authentication](https://firebase.google.com/products/auth)
- [Auth0](https://auth0.com/)
- [Clerk](https://clerk.dev/)

---

## 🐛 Troubleshooting

### "Admin authentication not configured" error
**Problem:** Environment variables not set in Vercel  
**Solution:** Add all required env vars in Vercel dashboard, then redeploy

### Demo users can't log in
**Problem:** `VITE_DEFAULT_USER_PASSWORD` not set  
**Solution:** Set this variable in Vercel and redeploy

### Changes not reflecting
**Problem:** Browser cache or old deployment  
**Solution:** Hard refresh (Ctrl+Shift+R) or trigger new deployment

---

## 📞 Need Help?

1. Check Vercel deployment logs
2. Open browser console for errors (F12)
3. Review [Vercel Documentation](https://vercel.com/docs)

---

## ✅ Deployment Complete?

After successful deployment:

1. ✅ Test admin login
2. ✅ Test demo user login
3. ✅ Verify all pages load correctly
4. ✅ Check browser console for errors
5. ✅ Bookmark your admin panel URL

**Your site is ready! 🎉**
