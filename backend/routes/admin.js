import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { createHistoryEntry } from '../utils/history.js';

const router = express.Router();
const prisma = new PrismaClient();

// Protect all admin routes
router.use(authenticate);
router.use(requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: {
        history: {
          take: 50,
          orderBy: { createdAt: 'desc' }
        },
        deposits: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        },
        withdrawals: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Set user balance
router.post('/users/:userId/set-balance', async (req, res) => {
  try {
    const { balance } = req.body;
    
    if (typeof balance !== 'number' || balance < 0) {
      return res.status(400).json({ error: 'Invalid balance' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        balance,
        history: {
          create: createHistoryEntry('admin.setBalance', { amount: balance })
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'set_balance',
        targetId: user.id,
        performedBy: req.user.email,
        details: { oldBalance: user.balance, newBalance: balance }
      }
    });

    res.json({ user, message: 'Balance updated' });
  } catch (error) {
    console.error('Set balance error:', error);
    res.status(500).json({ error: 'Failed to set balance' });
  }
});

// Inject profit
router.post('/users/:userId/inject-profit', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.userId }
    });

    const newBalance = Number((user.balance + amount).toFixed(2));

    const updatedUser = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        balance: newBalance,
        history: {
          create: createHistoryEntry('admin.injectProfit', { amount })
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'inject_profit',
        targetId: user.id,
        performedBy: req.user.email,
        details: { amount, oldBalance: user.balance, newBalance }
      }
    });

    res.json({ user: updatedUser, message: 'Profit injected' });
  } catch (error) {
    console.error('Inject profit error:', error);
    res.status(500).json({ error: 'Failed to inject profit' });
  }
});

// Freeze/Unfreeze account
router.post('/users/:userId/freeze', async (req, res) => {
  try {
    const { freeze } = req.body; // true or false
    
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        frozen: freeze,
        history: {
          create: createHistoryEntry(freeze ? 'admin.freeze' : 'admin.unfreeze', {})
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: freeze ? 'freeze_account' : 'unfreeze_account',
        targetId: user.id,
        performedBy: req.user.email,
        details: { frozen: freeze }
      }
    });

    res.json({ user, message: freeze ? 'Account frozen' : 'Account unfrozen' });
  } catch (error) {
    console.error('Freeze error:', error);
    res.status(500).json({ error: 'Failed to update account status' });
  }
});

// Toggle KYC lock
router.post('/users/:userId/kyc-lock', async (req, res) => {
  try {
    const { lock } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { kycLocked: lock }
    });

    await prisma.auditLog.create({
      data: {
        action: lock ? 'kyc_lock' : 'kyc_unlock',
        targetId: user.id,
        performedBy: req.user.email,
        details: { kycLocked: lock }
      }
    });

    res.json({ user, message: lock ? 'KYC locked' : 'KYC unlocked' });
  } catch (error) {
    console.error('KYC lock error:', error);
    res.status(500).json({ error: 'Failed to update KYC status' });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(skip)
    });

    const total = await prisma.auditLog.count();

    res.json({ logs, total });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Platform analytics
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    const totalBalance = await prisma.user.aggregate({
      _sum: { balance: true }
    });

    const pendingDeposits = await prisma.deposit.count({
      where: { status: 'PENDING' }
    });

    const pendingWithdrawals = await prisma.withdrawal.count({
      where: { status: 'PENDING' }
    });

    const openTickets = await prisma.supportTicket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
    });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      balances: {
        total: totalBalance._sum.balance || 0
      },
      pending: {
        deposits: pendingDeposits,
        withdrawals: pendingWithdrawals,
        tickets: openTickets
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
