import nodemailer from 'nodemailer';

// Email transporter configuration
let transporter;

if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  console.log('✅ Email service configured');
} else {
  console.warn('⚠️ Email service not configured - verification emails will be logged to console');
}

// Generate 6-digit verification code
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification code email
export async function sendVerificationEmail(email, code, name = 'User') {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"24h Trading Platform" <noreply@24htrading.com>',
    to: email,
    subject: 'Verify Your Email - 24h Trading Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 40px 30px;
          }
          .code-box {
            background: #f0ad4e;
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .info {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #f0ad4e;
            padding: 12px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Email Verification</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Thank you for registering with 24h Trading Platform. To complete your registration, please use the verification code below:</p>
            
            <div class="code-box">
              ${code}
            </div>
            
            <div class="info">
              <p><strong>This code will expire in 15 minutes.</strong></p>
              <p>If you didn't request this verification code, please ignore this email.</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2025 24h Trading Platform. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  // If email service is configured, send email
  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      // Fall through to console logging
    }
  }
  
  // Fallback: Log to console (for development)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 VERIFICATION EMAIL (DEV MODE)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${email}`);
  console.log(`Name: ${name}`);
  console.log(`Verification Code: ${code}`);
  console.log(`Expires: 15 minutes`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return true;
}

// Send password reset email
export async function sendPasswordResetEmail(email, code, name = 'User') {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"24h Trading Platform" <noreply@24htrading.com>',
    to: email,
    subject: 'Password Reset - 24h Trading Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: #f6465d;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 40px 30px;
          }
          .code-box {
            background: #f6465d;
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .info {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
          }
          .warning {
            background: #fee;
            border-left: 4px solid #f6465d;
            padding: 12px;
            margin: 20px 0;
            color: #c00;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>We received a request to reset your password. Use the code below to reset your password:</p>
            
            <div class="code-box">
              ${code}
            </div>
            
            <div class="info">
              <p><strong>This code will expire in 15 minutes.</strong></p>
              <p>If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Alert:</strong> If you didn't request this password reset, someone may be trying to access your account. Please change your password immediately.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2025 24h Trading Platform. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  // If email service is configured, send email
  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
    }
  }
  
  // Fallback: Log to console
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 PASSWORD RESET EMAIL (DEV MODE)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${email}`);
  console.log(`Name: ${name}`);
  console.log(`Reset Code: ${code}`);
  console.log(`Expires: 15 minutes`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return true;
}
