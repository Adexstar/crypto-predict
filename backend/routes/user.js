import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        spotBalance: true,
        futuresBalance: true,
        optionsBalance: true,
        frozen: true,
        kyc: true,
        kycLocked: true,
        vip: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user history
router.get('/history', authenticate, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const history = await prisma.history.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(skip),
      select: {
        id: true,
        action: true,
        message: true,
        meta: true,
        createdAt: true,
      }
    });

    const total = await prisma.history.count({
      where: { userId: req.user.id }
    });

    res.json({ history, total, limit: parseInt(limit), skip: parseInt(skip) });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Update profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        history: {
          create: {
            action: 'profile.updated',
            message: `Profile updated - name`,
            meta: { fields: ['name'] }
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
      }
    });

    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
