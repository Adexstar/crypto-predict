# Vercel Environment Variables Setup

## ⚠️ SECURITY: Admin Credentials Configuration

**DO NOT store admin credentials in Vite frontend environment variables!**

Vite variables (prefixed with `VITE_`) are exposed to the browser and visible in the frontend code. For production security:

### ✅ Secure Approach (Recommended)

Admin credentials are now authenticated via **backend API only**:

1. Admin emails/passwords are stored server-side in environment variables
2. The frontend only receives a secure JWT token upon successful authentication
3. The token is used for subsequent API requests

### Backend Variables (SECURE - Server Only)

These variables should be configured **in Vercel** but are NEVER exposed to the frontend:

```
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-secure-admin-password
JWT_SECRET=your-very-long-random-secret-key-minimum-32-chars
NODE_ENV=production
```

### Other Backend Variables

```
FRONTEND_URL=https://your-domain.vercel.app
DATABASE_URL=your-database-connection-string
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Steps to Configure in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard

2. **Select Your Project**
   - Click on "crypto-predict" project

3. **Go to Settings**
   - Click the "Settings" tab

4. **Environment Variables**
   - Click "Environment Variables" in the left sidebar

5. **Add Variables**
   - Click "Add New" button
   - Enter each variable name and value
   - **DO NOT use `VITE_` prefix for sensitive data**
   - For backend variables, leave them as-is (e.g., `ADMIN_EMAIL`, not `VITE_ADMIN_EMAIL`)

6. **Select Environment**
   - Choose which environments variables apply to
   - For production credentials: **Production only**
   - For non-sensitive configs: All environments

## Example Values

```
ADMIN_EMAIL=admin@cryptopredict.com
ADMIN_PASSWORD=ChangeMe!SecurePassword123
JWT_SECRET=your_jwt_secret_here_must_be_at_least_32_characters_long_use_random_string
NODE_ENV=production
FRONTEND_URL=https://crypto-predict-ebon.vercel.app
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

## Local Development

For local development, create a `.env` file in the `backend/` directory:

```bash
ADMIN_EMAIL=admin@crypto.com
ADMIN_PASSWORD=SecureAdminPass123!
JWT_SECRET=dev_secret_key_minimum_32_characters_for_testing
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=your_local_db_url
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Important:** This file is in `.gitignore` and should NEVER be committed.

## Security Best Practices

✅ **DO:**
- Store passwords only in backend environment variables
- Use strong, unique admin passwords (min 12+ characters, mixed case, numbers, symbols)
- Rotate admin credentials regularly
- Use HTTPS for all connections
- Monitor failed login attempts
- Implement rate limiting on admin endpoints

❌ **DON'T:**
- Store passwords in frontend code or Vite variables
- Commit `.env` files to Git
- Use default or weak passwords
- Reuse passwords across services
- Log passwords or sensitive data

## Admin Login Flow

1. User enters credentials in frontend form
2. Frontend sends POST request to `/api/auth/admin-login`
3. Backend validates credentials against `ADMIN_EMAIL` and `ADMIN_PASSWORD`
4. On success, backend returns JWT token (valid for 24 hours)
5. Frontend stores token and uses it for admin API requests
6. Token is validated server-side for all admin operations

## Redeployment

After adding/changing environment variables in Vercel:

1. The next deployment will use the new variables automatically
2. To force a redeployment, go to Deployments → Redeploy
3. Or push a new commit to main branch

## Troubleshooting

### Error: "Admin authentication not configured on server"
- Check Vercel Settings → Environment Variables
- Ensure `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set (without `VITE_` prefix)
- Redeploy the project

### Error: "Invalid admin credentials"
- Verify the email and password match what's in Vercel environment
- Check for extra spaces or typos
- Ensure you're entering the exact values

### Token Issues
- Clear browser cache and localStorage
- The JWT token expires after 24 hours - user must log in again
- Check browser DevTools Console for error messages

## Migrating from Old Frontend-Based Auth

If you were previously using `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD`:

1. ✅ Remove these variables from Vercel frontend environments
2. ✅ Add new `ADMIN_EMAIL` and `ADMIN_PASSWORD` (no `VITE_` prefix) to backend
3. ✅ Redeploy the project
4. ✅ Test admin login on the new backend authentication
