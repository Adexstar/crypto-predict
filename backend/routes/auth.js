import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { createHistoryEntry } from '../utils/history.js';
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const router = express.Router();
const prisma = new PrismaClient();

// Send verification code (before registration)
router.post('/send-verification-code',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Check if email already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Generate and store verification code temporarily
      const verificationCode = generateVerificationCode();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store code in a temporary table or use a cache (for now, we'll create a pending user record)
      // Since we don't have a temp table, we'll create the user with a flag
      const tempUser = await prisma.user.upsert({
        where: { email },
        update: {
          verificationCode,
          verificationCodeExpires,
        },
        create: {
          email,
          password: '', // Empty password for now
          name: email.split('@')[0],
          role: 'USER',
          emailVerified: false,
          verificationCode,
          verificationCodeExpires,
          pendingRegistration: true, // Flag to indicate incomplete registration
        }
      });

      // Send verification email
      await sendVerificationEmail(email, verificationCode, email.split('@')[0]);

      res.json({
        message: 'Verification code sent to your email',
        email,
      });
    } catch (error) {
      console.error('Send verification code error:', error);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  }
);

// Verify code only (before final registration)
router.post('/verify-code',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, code } = req.body;

      // Find user
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(404).json({ error: 'No verification code found for this email' });
      }

      // Verify the code
      if (user.verificationCode !== code) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Check code expiration
      if (!user.verificationCodeExpires || new Date() > user.verificationCodeExpires) {
        return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
      }

      res.json({
        message: 'Code verified successfully',
        email,
      });
    } catch (error) {
      console.error('Verify code error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').optional().trim(),
    body('code').isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, code } = req.body;

      // Check if user exists and get verification code
      const existing = await prisma.user.findUnique({ where: { email } });
      
      if (!existing) {
        return res.status(400).json({ error: 'Please request a verification code first' });
      }

      // If user has a real password (not empty), they're already registered
      if (existing.password && existing.password.length > 10) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Verify the code
      if (existing.verificationCode !== code) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Check code expiration
      if (!existing.verificationCodeExpires || new Date() > existing.verificationCodeExpires) {
        return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user with complete registration
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashedPassword,
          name: name || email.split('@')[0],
          emailVerified: true, // Verified immediately since they used the code
          verificationCode: null,
          verificationCodeExpires: null,
          pendingRegistration: false,
          history: {
            create: createHistoryEntry('account.created', { email })
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          balance: true,
          spotBalance: true,
          futuresBalance: true,
          optionsBalance: true,
          kyc: true,
          vip: true,
          emailVerified: true,
          createdAt: true,
        }
      });

      // Generate token and auto-login
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        user,
        token,
        message: 'Account created and verified successfully!'
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if frozen
      if (user.frozen) {
        return res.status(403).json({ error: 'Account is frozen. Contact support.' });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({ 
          error: 'Please verify your email first',
          requiresVerification: true 
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          history: {
            create: createHistoryEntry('account.login', {})
          }
        }
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          balance: user.balance,
          spotBalance: user.spotBalance,
          futuresBalance: user.futuresBalance,
          optionsBalance: user.optionsBalance,
          kyc: user.kyc,
          vip: user.vip,
        },
        token,
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's an admin token
    if (decoded.adminId === 'system_admin' && decoded.role === 'ADMIN') {
      return res.json({ 
        user: {
          id: 'system_admin',
          email: decoded.email,
          role: 'ADMIN',
          name: 'Administrator'
        },
        valid: true 
      });
    }
    
    // Otherwise, it's a regular user token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        frozen: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user, valid: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', valid: false });
  }
});

// Verify email with code
router.post('/verify-email',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, code } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      // Check code
      if (user.verificationCode !== code) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Check expiration
      if (!user.verificationCodeExpires || new Date() > user.verificationCodeExpires) {
        return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationCode: null,
          verificationCodeExpires: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          balance: true,
          emailVerified: true,
        }
      });

      // Create history entry
      await prisma.history.create({
        data: {
          userId: user.id,
          ...createHistoryEntry('account.verified', { email })
        }
      });

      res.json({
        user: updatedUser,
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

// Resend verification code
router.post('/resend-verification',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      // Generate new code
      const verificationCode = generateVerificationCode();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationCodeExpires,
        }
      });

      // Send email
      await sendVerificationEmail(email, verificationCode, user.name);

      res.json({
        message: 'Verification code sent. Please check your email.'
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ error: 'Failed to resend verification code' });
    }
  }
);

// Request password reset
router.post('/forgot-password',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      // Don't reveal if user exists
      if (!user) {
        return res.json({
          message: 'If an account exists with this email, a password reset code has been sent.'
        });
      }

      // Generate reset code
      const verificationCode = generateVerificationCode();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationCodeExpires,
        }
      });

      // Send email
      await sendPasswordResetEmail(email, verificationCode, user.name);

      res.json({
        message: 'If an account exists with this email, a password reset code has been sent.'
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// Reset password with code
router.post('/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, code, newPassword } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check code
      if (user.verificationCode !== code) {
        return res.status(400).json({ error: 'Invalid reset code' });
      }

      // Check expiration
      if (!user.verificationCodeExpires || new Date() > user.verificationCodeExpires) {
        return res.status(400).json({ error: 'Reset code expired. Please request a new code.' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          verificationCode: null,
          verificationCodeExpires: null,
        }
      });

      // Create history entry
      await prisma.history.create({
        data: {
          userId: user.id,
          ...createHistoryEntry('security.passwordReset', { email })
        }
      });

      res.json({
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
);

// Change password (authenticated users only)
router.post('/change-password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { currentPassword, newPassword } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          history: {
            create: createHistoryEntry('security.passwordChanged', {})
          }
        }
      });

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// Admin login (secure backend authentication)
// Health check endpoint to verify admin credentials are configured
router.get('/admin-status', async (req, res) => {
  const hasAdminEmail = !!process.env.ADMIN_EMAIL;
  const hasAdminPassword = !!process.env.ADMIN_PASSWORD;
  const hasJWTSecret = !!process.env.JWT_SECRET;
  const allConfigured = hasAdminEmail && hasAdminPassword && hasJWTSecret;

  console.log('🔍 Admin Configuration Check:');
  console.log(`   ADMIN_EMAIL configured: ${hasAdminEmail ? '✅' : '❌'}`);
  console.log(`   ADMIN_PASSWORD configured: ${hasAdminPassword ? '✅' : '❌'}`);
  console.log(`   JWT_SECRET configured: ${hasJWTSecret ? '✅' : '❌'}`);
  console.log(`   All configured: ${allConfigured ? '✅' : '❌'}`);

  res.json({
    adminConfigured: allConfigured,
    details: {
      adminEmail: hasAdminEmail ? 'Configured' : 'MISSING ❌',
      adminPassword: hasAdminPassword ? 'Configured' : 'MISSING ❌',
      jwtSecret: hasJWTSecret ? 'Configured' : 'MISSING ❌'
    },
    message: allConfigured 
      ? 'Admin credentials are properly configured ✅'
      : 'Some admin credentials are missing. Check Railway environment variables ❌'
  });
});

// Email configuration status
router.get('/email-status', async (req, res) => {
  const hasEmailService = !!process.env.EMAIL_SERVICE;
  const hasEmailUser = !!process.env.EMAIL_USER;
  const hasEmailPassword = !!process.env.EMAIL_PASSWORD;
  const emailServiceValue = process.env.EMAIL_SERVICE || 'NOT SET';
  const allConfigured = hasEmailService && hasEmailUser && hasEmailPassword;

  console.log('📧 Email Configuration Check:');
  console.log(`   EMAIL_SERVICE configured: ${hasEmailService ? '✅' : '❌'} (${emailServiceValue})`);
  console.log(`   EMAIL_USER configured: ${hasEmailUser ? '✅' : '❌'}`);
  console.log(`   EMAIL_PASSWORD configured: ${hasEmailPassword ? '✅' : '❌'}`);
  console.log(`   All configured: ${allConfigured ? '✅' : '❌'}`);

  res.json({
    emailConfigured: allConfigured,
    details: {
      emailService: hasEmailService ? `Configured (${emailServiceValue})` : 'MISSING ❌',
      emailUser: hasEmailUser ? 'Configured' : 'MISSING ❌',
      emailPassword: hasEmailPassword ? 'Configured' : 'MISSING ❌'
    },
    message: allConfigured 
      ? `Email service properly configured with ${emailServiceValue} ✅`
      : 'Some email configuration is missing. Check Railway environment variables ❌',
    instructions: 'See EMAIL_SETUP.md for configuration instructions'
  });
});

router.post('/admin-login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if admin credentials are configured in environment
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

      if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        return res.status(503).json({ error: 'Admin authentication not configured on server' });
      }

      // Verify credentials
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        // Log failed attempt for security
        console.warn(`Failed admin login attempt from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      // Generate admin token
      const token = jwt.sign(
        { 
          email: ADMIN_EMAIL, 
          role: 'ADMIN',
          adminId: 'system_admin'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log successful admin login
      console.log(`Successful admin login at ${new Date().toISOString()}`);

      res.json({
        email: ADMIN_EMAIL,
        token,
        role: 'ADMIN',
        message: 'Admin authentication successful'
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Admin authentication failed' });
    }
  }
);

export default router;
