import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { createHistoryEntry } from '../utils/history.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Submit deposit
router.post('/', async (req, res) => {
  try {
    const { amount, network, asset, walletAddress } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const deposit = await prisma.deposit.create({
      data: {
        userId: req.user.id,
        amount,
        network: network || 'TRC20',
        asset: asset || 'USDT',
        walletAddress,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 60000) // 30 min
      }
    });

    await prisma.history.create({
      data: {
        userId: req.user.id,
        ...createHistoryEntry('deposit.submitted', { 
          id: deposit.id, 
          amount, 
          network, 
          asset 
        })
      }
    });

    res.status(201).json({ 
      deposit, 
      message: 'Deposit request submitted successfully' 
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Failed to submit deposit' });
  }
});

// Get user deposits
router.get('/', async (req, res) => {
  try {
    const deposits = await prisma.deposit.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ deposits });
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

// Admin: Get all pending deposits
router.get('/pending', authenticate, async (req, res) => {
  console.log('📍 Pending deposits request');
  console.log('   User:', JSON.stringify(req.user));
  console.log('   Role check:', req.user?.role, '===', 'ADMIN', '?', req.user?.role === 'ADMIN');
  
  if (req.user?.role !== 'ADMIN') {
    console.log('❌ Access denied - not admin. Role:', req.user?.role);
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    console.log('✅ Admin verified, fetching deposits...');
    const deposits = await prisma.deposit.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${deposits.length} pending deposits`);
    res.json({ deposits });
  } catch (error) {
    console.error('❌ Pending deposits DB error:', error.message);
    console.error('   Full error:', error);
    res.status(500).json({ error: 'Failed to fetch pending deposits', details: error.message });
  }
});

// Admin: Confirm deposit
router.post('/:depositId/confirm', authenticate, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { amount } = req.body;
    const depositId = req.params.depositId;

    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId }
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    const depositAmount = amount || deposit.amount;

    // Update deposit and user balance in transaction
    const [updatedDeposit, user] = await prisma.$transaction(async (tx) => {
      const dep = await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      });

      const usr = await tx.user.update({
        where: { id: deposit.userId },
        data: {
          balance: { increment: depositAmount },
          history: {
            create: createHistoryEntry('deposit.confirmed', { 
              id: depositId, 
              amount: depositAmount 
            })
          }
        }
      });

      return [dep, usr];
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'confirm_deposit',
        targetId: deposit.userId,
        performedBy: req.user.email,
        details: JSON.stringify({ depositId, amount: depositAmount })
      }
    });

    res.json({ 
      deposit: updatedDeposit, 
      message: 'Deposit confirmed successfully' 
    });
  } catch (error) {
    console.error('Confirm deposit error:', error);
    res.status(500).json({ error: 'Failed to confirm deposit' });
  }
});

// Admin: Reject deposit
router.post('/:depositId/reject', authenticate, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { reason } = req.body;
    const depositId = req.params.depositId;

    const deposit = await prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason || 'Verification failed'
      }
    });

    await prisma.history.create({
      data: {
        userId: deposit.userId,
        ...createHistoryEntry('deposit.rejected', { 
          id: depositId, 
          reason 
        })
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'reject_deposit',
        targetId: deposit.userId,
        performedBy: req.user.email,
        details: JSON.stringify({ depositId, reason })
      }
    });

    res.json({ deposit, message: 'Deposit rejected' });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
});

export default router;
