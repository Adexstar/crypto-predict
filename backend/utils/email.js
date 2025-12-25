import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

// Email transporter configuration
let transporter;
let emailConfigured = false;
let usingSendGrid = false;

// Initialize email service
function initializeEmailService() {
  const emailService = process.env.EMAIL_SERVICE;
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  
  // Check for SendGrid API first (recommended for cloud deployments)
  if (emailService === 'sendgrid-api' || sendgridApiKey) {
    if (!sendgridApiKey) {
      console.warn('⚠️  SendGrid API selected but SENDGRID_API_KEY is missing');
      return;
    }
    
    try {
      sgMail.setApiKey(sendgridApiKey);
      usingSendGrid = true;
      emailConfigured = true;
      console.log('✅ Email service configured: SendGrid API (recommended for cloud)');
      return;
    } catch (error) {
      console.error('❌ Failed to initialize SendGrid:', error.message);
      return;
    }
  }
  
  // Fall back to SMTP-based email services
  if (!emailService || !emailUser || !emailPassword) {
    console.warn('⚠️  EMAIL SERVICE NOT CONFIGURED');
    console.warn('   For cloud deployments (Railway), use SendGrid API:');
    console.warn('   - Set EMAIL_SERVICE=sendgrid-api');
    console.warn('   - Set SENDGRID_API_KEY=your-api-key');
    console.warn('   - Set EMAIL_FROM=verified@yourdomain.com');
    console.warn('   See EMAIL_SETUP.md for detailed instructions');
    return;
  }
  
  try {
    console.log(`📧 Initializing email service: ${emailService}`);
    
    // Support Gmail and other SMTP services
    if (emailService.toLowerCase() === 'gmail' || emailService.toLowerCase() === 'sendgrid') {
      console.log(`   Service type: ${emailService.toLowerCase()}`);
      console.log(`   User: ${emailUser}`);
      console.warn('   ⚠️ SMTP may be blocked by cloud providers (use sendgrid-api instead)');
      
      transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPassword
        },
        connectionTimeout: 30000,
        socketTimeout: 30000,
        greetingTimeout: 30000,
        pool: {
          maxConnections: 3,
          maxMessages: 50,
          rateDelta: 1000,
          rateLimit: 5
        },
        secure: true,
        requireTLS: true
      });
      
      // Test the connection
      transporter.verify((error, success) => {
        if (error) {
          console.error(`❌ Email transporter verification failed: ${error.message}`);
          if (emailService.toLowerCase() === 'gmail') {
            console.error('   💡 For Gmail, use App Password not your regular password');
            console.error('   💡 Enable 2-Step Verification: https://myaccount.google.com/security');
            console.error('   💡 Generate App Password: https://myaccount.google.com/apppasswords');
          }
          console.error('   💡 If on Railway/cloud, SMTP ports may be blocked. Use SendGrid API instead.');
        } else {
          console.log('✅ Email transporter verified and ready');
          emailConfigured = true;
        }
      });
    } else if (emailService.toLowerCase() === 'custom' || process.env.SMTP_HOST) {
      // Custom SMTP server configuration
      console.log(`   Custom SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
      
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || emailUser,
          pass: process.env.SMTP_PASS || emailPassword
        },
        connectionTimeout: 30000,
        socketTimeout: 30000,
        greetingTimeout: 30000
      });
    } else {
      console.warn(`⚠️  Unknown EMAIL_SERVICE: ${emailService}`);
      console.warn('   Supported: sendgrid-api (recommended), gmail, sendgrid, or set SMTP_HOST for custom SMTP');
      return;
    }
    
    emailConfigured = true;
    console.log(`✅ Email service configured: ${emailService}`);
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
  }
}

// Initialize on module load
initializeEmailService();

// Export function to check if email is configured
export function isEmailConfigured() {
  return emailConfigured;
}

// Export function to get email status
export function getEmailStatus() {
  return {
    configured: emailConfigured,
    service: process.env.EMAIL_SERVICE || 'NOT SET',
    hasUser: !!process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD
  };
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

  // SendGrid API (recommended for cloud)
  if (usingSendGrid && emailConfigured) {
    try {
      console.log(`📤 Sending verification email via SendGrid to ${email}...`);
      await sgMail.send(mailOptions);
      console.log(`✅ Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ SendGrid email failed: ${error.message}`);
      if (error.response) {
        console.error('   Response:', error.response.body);
      }
    }
  }
  
  // SMTP-based email (may be blocked by cloud providers)
  if (emailConfigured && transporter) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📤 Sending verification email to ${email} (attempt ${attempt}/3)...`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email}`);
        return true;
      } catch (error) {
        lastError = error;
        console.error(`❌ Email send attempt ${attempt} failed: ${error.message}`);
        if (attempt < 3) {
          const delayMs = 2000 * attempt;
          console.log(`⏳ Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    console.error(`❌ Failed to send verification email after 3 attempts: ${lastError?.message}`);
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

  // SendGrid API (recommended for cloud)
  if (usingSendGrid && emailConfigured) {
    try {
      console.log(`📤 Sending password reset email via SendGrid to ${email}...`);
      await sgMail.send(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ SendGrid email failed: ${error.message}`);
      if (error.response) {
        console.error('   Response:', error.response.body);
      }
    }
  }

  // SMTP-based email (may be blocked by cloud providers)
  if (emailConfigured && transporter) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📤 Sending password reset email to ${email} (attempt ${attempt}/3)...`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${email}`);
        return true;
      } catch (error) {
        lastError = error;
        console.error(`❌ Email send attempt ${attempt} failed: ${error.message}`);
        if (attempt < 3) {
          const delayMs = 2000 * attempt;
          console.log(`⏳ Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    console.error(`❌ Failed to send password reset email after 3 attempts: ${lastError?.message}`);
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
