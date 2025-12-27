import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { createHistoryEntry } from '../utils/history.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Submit withdrawal
router.post('/', async (req, res) => {
  try {
    const { amount, walletAddress, network } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user.frozen) {
      return res.status(403).json({ error: 'Account is frozen' });
    }

    if (user.kycLocked) {
      return res.status(403).json({ error: 'KYC verification required' });
    }

    if (amount > user.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: req.user.id,
        amount,
        status: 'PENDING'
        // TODO: Enable after migration 20251227_add_deposit_withdrawal_fields runs
        // ...(walletAddress && { walletAddress }),
        // ...(network && { network })
      }
    });

    // Log the full submission details (even if not stored in DB yet)
    console.log('📝 Withdrawal submitted:', {
      withdrawalId: withdrawal.id,
      amount,
      network,
      walletAddress
    });

    await prisma.history.create({
      data: {
        userId: req.user.id,
        ...createHistoryEntry('withdraw.request', { 
          id: withdrawal.id, 
          amount 
        })
      }
    });

    res.status(201).json({ 
      withdrawal, 
      message: 'Withdrawal request submitted successfully' 
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Failed to submit withdrawal', details: error.message });
  }
});

// Get user withdrawals
router.get('/', async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ withdrawals });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals', details: error.message });
  }
});

// Admin: Get all pending withdrawals
router.get('/pending', authenticate, async (req, res) => {
  console.log('📍 Pending withdrawals request');
  console.log('   User:', JSON.stringify(req.user));
  console.log('   Role check:', req.user?.role, '===', 'ADMIN', '?', req.user?.role === 'ADMIN');
  
  if (req.user?.role !== 'ADMIN') {
    console.log('❌ Access denied - not admin. Role:', req.user?.role);
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    console.log('✅ Admin verified, fetching withdrawals...');
    // Query only columns that exist in the current database schema
    const withdrawals = await prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enhance with user data
    const enhancedWithdrawals = await Promise.all(
      withdrawals.map(async (wd) => {
        const user = await prisma.user.findUnique({
          where: { id: wd.userId },
          select: { id: true, email: true, name: true, balance: true }
        });
        return { ...wd, user };
      })
    );

    console.log(`✅ Found ${enhancedWithdrawals.length} pending withdrawals`);
    res.json({ withdrawals: enhancedWithdrawals });
  } catch (error) {
    console.error('❌ Pending withdrawals DB error:', error.message);
    console.error('   Full error:', error);
    res.status(500).json({ error: 'Failed to fetch pending withdrawals', details: error.message });
  }
});

// Admin: Approve withdrawal
router.post('/:withdrawalId/approve', authenticate, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const withdrawalId = req.params.withdrawalId;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId }
    });

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    // Update withdrawal and deduct balance in transaction
    const [updatedWithdrawal, user] = await prisma.$transaction(async (tx) => {
      const wd = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date()
        }
      });

      const usr = await tx.user.update({
        where: { id: withdrawal.userId },
        data: {
          balance: { decrement: withdrawal.amount },
          history: {
            create: createHistoryEntry('withdraw.approved', { 
              id: withdrawalId, 
              amount: withdrawal.amount 
            })
          }
        }
      });

      return [wd, usr];
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'approve_withdrawal',
        targetId: withdrawal.userId,
        performedBy: req.user.email,
        details: JSON.stringify({ withdrawalId, amount: withdrawal.amount })
      }
    });

    res.json({ 
      withdrawal: updatedWithdrawal, 
      message: 'Withdrawal approved successfully' 
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

// Admin: Reject withdrawal
router.post('/:withdrawalId/reject', authenticate, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { reason } = req.body;
    const withdrawalId = req.params.withdrawalId;

    const withdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason || 'Request denied'
      }
    });

    await prisma.history.create({
      data: {
        userId: withdrawal.userId,
        ...createHistoryEntry('withdraw.rejected', { 
          id: withdrawalId 
        })
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'reject_withdrawal',
        targetId: withdrawal.userId,
        performedBy: req.user.email,
        details: JSON.stringify({ withdrawalId, reason })
      }
    });

    res.json({ withdrawal, message: 'Withdrawal rejected' });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

export default router;
