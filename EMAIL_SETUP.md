# Email Configuration Setup Guide

## Overview
The application uses Nodemailer to send verification and password reset emails. 

⚠️ **IMPORTANT**: Railway and many cloud providers block outbound SMTP connections (ports 587/465) for security. If you see "Connection timeout" errors even with correct Gmail credentials, **use SendGrid API instead** (Option 1 below).

## Setup Options

### Option 1: SendGrid API (RECOMMENDED for Railway/Cloud)
SendGrid uses HTTP API instead of SMTP, which works reliably in cloud environments.

#### Steps:
1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up for a free account (100 emails/day free tier)

2. **Verify Sender Email**
   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your email and verify it

3. **Create API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "Railway Production"
   - Permissions: "Full Access" (or "Mail Send" only)
   - Copy the key (shown only once!)

4. **Configure Railway Environment Variables**
   - Go to your Railway project dashboard
   - Click on your Node.js service
   - Go to "Variables" tab
   - Add these variables:
     ```
     EMAIL_SERVICE=sendgrid-api
     SENDGRID_API_KEY=your-api-key-from-step-3
     EMAIL_FROM=verified-email@example.com
     ```
   - Replace `your-api-key-from-step-3` with the actual API key
   - Replace `verified-email@example.com` with the email you verified in step 2

5. **Redeploy**
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - Wait for deployment to complete (~2-5 minutes)

6. **Test**
   - Visit your app and try the password reset feature
   - Check the Railway logs: should see `✅ Email sent successfully`

---

### Option 2: Gmail (Only if SMTP ports are NOT blocked)
Gmail works but requires App Passwords and may be blocked by cloud providers.

#### Steps:
1. **Create a Google Account** (if you don't have one)
   - Use your company email or create a new one

2. **Enable 2-Step Verification**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

3. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password

4. **Configure Railway Environment Variables**
   - Go to your Railway project dashboard
   - Click on your Node.js service
   - Go to "Variables" tab
   - Add these variables:
     ```
     EMAIL_SERVICE=gmail
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASSWORD=your-16-char-app-password
     EMAIL_FROM="24h Trading Platform <your-email@gmail.com>"
     ```
   - Replace `your-email@gmail.com` with your actual Gmail address
   - Replace `your-16-char-app-password` with the password generated in step 3

5. **Redeploy**
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - Wait for deployment to complete (~2-5 minutes)

6. **Test**
   - Visit your app and try the password reset feature
   - Check the Railway logs to verify the email sends successfully

---

### Option 2: SendGrid (Alternative)
SendGrid is a professional email service with good deliverability.

#### Steps:
1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up for a free account

2. **Create API Key**
   - Go to Settings → API Keys
   - Create a new API key
   - Copy the key (it will only show once)

3. **Configure Railway**
   - Add these variables:
     ```
     EMAIL_SERVICE=SendGrid
     EMAIL_USER=apikey
     EMAIL_PASSWORD=your-sendgrid-api-key
     EMAIL_FROM=noreply@yourdomain.com
     ```

---

### Option 3: Custom SMTP Server
If you have your own SMTP server:

#### Steps:
1. **Get SMTP Details**
   - SMTP Host
   - SMTP Port (usually 587 for TLS or 465 for SSL)
   - Username
   - Password

2. **Configure Railway**
   - Modify backend/utils/email.js to support custom SMTP
   - Add these variables:
     ```
     EMAIL_SERVICE=custom
     SMTP_HOST=your-smtp-host.com
     SMTP_PORT=587
     SMTP_USER=your-username
     SMTP_PASS=your-password
     EMAIL_FROM=noreply@yourdomain.com
     ```

---

## Troubleshooting

### "Connection timeout" Error
- **Cause**: Email credentials not configured or incorrect
- **Solution**: 
  1. Verify all EMAIL_* variables are set in Railway
  2. Check that EMAIL_PASSWORD is correct (no typos)
  3. If using Gmail, verify the App Password (not your regular Gmail password)
  4. Redeploy after setting variables

### "Authentication failed" Error
- **Cause**: Wrong username or password
- **Solution**:
  1. Double-check EMAIL_USER and EMAIL_PASSWORD
  2. For Gmail, ensure you're using the 16-character App Password, not your regular password
  3. Verify 2-Step Verification is enabled on Gmail account

### "Invalid sender address" Error
- **Cause**: EMAIL_FROM format is incorrect
- **Solution**: 
  - Use format: `"Company Name <email@example.com>"`
  - Or just: `email@example.com`

### Still Not Working?
1. Check Railway logs for detailed error messages
2. Verify environment variables are set (check Variables tab, not Logs)
3. Redeploy to apply new environment variables
4. Test with the password reset feature
5. Look for "Sending verification email" in logs to confirm attempts

---

## Current System Behavior

### When Email Service is NOT Configured
- Email sending attempts fail (Connection timeout)
- System falls back to console logging
- Users see the reset code in Railway logs (DEV MODE only)
- **Users cannot receive emails** ❌

### When Email Service IS Configured
- Emails send successfully
- Users receive verification and reset emails
- System works as intended ✅

---

## Recommended Configuration
For production, use **Gmail (Option 1)** as it's:
- Free to set up
- Reliable and well-tested
- Doesn't require additional services
- Easy to troubleshoot

Follow the Gmail steps above to get started!
