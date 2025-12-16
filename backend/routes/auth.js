import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { createHistoryEntry } from '../utils/history.js';
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const router = express.Router();
const prisma = new PrismaClient();

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if user exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification code
      const verificationCode = generateVerificationCode();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split('@')[0],
          role: 'USER',
          emailVerified: false,
          verificationCode,
          verificationCodeExpires,
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
          emailVerified: true,
          createdAt: true,
        }
      });

      // Send verification email
      await sendVerificationEmail(email, verificationCode, user.name);

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        user,
        token,
        message: 'Account created successfully. Please check your email for verification code.',
        requiresVerification: true
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

export default router;
