# Email Verification Setup Guide

Email verification has been added to enhance security.

## 🔧 Configuration

### 1. Email Service Setup (Gmail Example)

**For Gmail:**
1. Go to Google Account settings
2. Enable 2-Step Verification
3. Generate an "App Password":
   - Visit: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" (Custom name: "Trading Platform")
   - Copy the 16-character password

**Update `.env` file:**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM="24h Trading Platform <noreply@24htrading.com>"
```

### 2. Other Email Services

**SendGrid:**
```env
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```env
EMAIL_SERVICE=Mailgun
EMAIL_USER=your-mailgun-username
EMAIL_PASSWORD=your-mailgun-password
```

**Outlook/Hotmail:**
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

## 📧 How It Works

### Registration Flow
1. User signs up → Account created
2. 6-digit verification code generated (expires in 15 min)
3. Email sent to user
4. User enters code on [verify-email.html](../verify-email.html)
5. Email verified → Full account access

### Login Flow
- **Unverified users**: Can login but see verification banner
- **Verified users**: Full access to all features
- **Withdrawals**: Require verified email

### Password Reset Flow
1. User requests password reset
2. 6-digit code sent via email
3. User enters code + new password
4. Password updated

## 🎯 Features

### Verification Code
- ✅ 6 random digits
- ✅ 15-minute expiration
- ✅ One-time use
- ✅ Resend with cooldown

### Email Templates
- ✅ Professional HTML design
- ✅ Security warnings
- ✅ Expiration notice
- ✅ Branded styling

### Development Mode
If email credentials not configured:
- Codes logged to console
- Full verification flow still works
- Perfect for local testing

## 🔒 Security Features

### Protection
- Rate limiting on verification endpoints
- Code expiration (15 minutes)
- One code per email at a time
- Secure password reset flow

### Best Practices
- Never share verification codes
- Codes expire quickly
- Email verified before withdrawals
- Admin actions logged

## 📱 Frontend Integration

### New Page
**[verify-email.html](../verify-email.html)**
- Clean 6-digit input UI
- Auto-focus and navigation
- Paste support
- Resend with 60s cooldown
- Real-time validation

### Updated Flow
```javascript
// After signup
if (response.requiresVerification) {
  window.location.href = '/verify-email.html';
} else {
  window.location.href = '/index.html';
}
```

### Dashboard Banner
Show verification reminder if email not verified:
```javascript
if (!user.emailVerified) {
  showBanner('Please verify your email to enable withdrawals');
}
```

## 🧪 Testing

### Local Development

1. **Start backend:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Watch console for codes:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📧 VERIFICATION EMAIL (DEV MODE)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   To: test@example.com
   Name: Test User
   Verification Code: 123456
   Expires: 15 minutes
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

3. **Test flow:**
   - Register new user
   - Check console for code
   - Go to `/verify-email.html`
   - Enter code
   - Email verified!

### Production Testing

1. **Configure real email service** in Railway env vars
2. **Register new account**
3. **Check email inbox** for verification code
4. **Verify email** via code entry
5. **Confirm** withdrawals now enabled

## 🚀 Deployment

### Railway Environment Variables
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="24h Trading Platform <noreply@yourdomain.com>"
```

### Vercel (Frontend)
No changes needed - [verify-email.html](../verify-email.html) already included.

## 📋 API Endpoints

### Verify Email
```http
POST /api/auth/verify-email
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully",
  "emailVerified": true
}
```

### Resend Verification
```http
POST /api/auth/resend-verification
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Verification code sent to your email"
}
```

### Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

## 🎨 Customization

### Email Template
Edit [backend/utils/email.js](../backend/utils/email.js):
- Change colors
- Add logo
- Modify text
- Add social links

### Verification Page
Edit [verify-email.html](../verify-email.html):
- Styling
- Layout
- Messages
- Redirect behavior

## ⚙️ Optional Features

### Make Verification Optional
In [backend/routes/auth.js](../backend/routes/auth.js):
```javascript
// Allow unverified users to login
emailVerified: false, // Don't block
```

### Require Verification for Withdrawals
In [backend/routes/withdrawal.js](../backend/routes/withdrawal.js):
```javascript
// Already implemented
if (!user.emailVerified) {
  return res.status(403).json({ 
    error: 'Email verification required for withdrawals' 
  });
}
```

## 📊 Database Schema

```prisma
model User {
  // ... other fields
  
  // Email verification
  emailVerified           Boolean   @default(false)
  verificationCode        String?
  verificationCodeExpires DateTime?
}
```

## 🔄 Migration

If you already have users:
```bash
# Run migration
cd backend
npx prisma migrate dev --name add_email_verification

# All existing users will have emailVerified = false
# They'll need to verify on next login
```

## 📞 Support

### Common Issues

**"Email not sending"**
- Check email credentials
- Verify app password is correct
- Check spam folder
- View server logs

**"Code expired"**
- Request new code
- Codes valid for 15 minutes only

**"Invalid code"**
- Check email for latest code
- Codes are case-sensitive (all numbers)

---

**Status**: ✅ Email verification fully implemented  
**Deployment ready**: Yes  
**Optional**: Can be disabled if needed
