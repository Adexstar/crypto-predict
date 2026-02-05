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
    const { amount, network, asset, walletAddress, method, details } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const depositData = {
      userId: req.user.id,
      amount,
      method: method || 'CRYPTO',
      network: network || null,
      asset: asset || null,
      walletAddress: walletAddress || null,
      details: details || null,
      status: 'PENDING'
    };

    const deposit = await prisma.deposit.create({
      data: depositData
    });

    // Log the submission details
    console.log('📝 Deposit submitted:', {
      depositId: deposit.id,
      amount,
      method: deposit.method,
      network,
      asset,
      walletAddress
    });

    await prisma.history.create({
      data: {
        userId: req.user.id,
        ...createHistoryEntry('deposit.submitted', { 
          id: deposit.id, 
          amount, 
          method: deposit.method,
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
    res.status(500).json({ error: 'Failed to submit deposit', details: error.message });
  }
});

// Get user deposits
router.get('/', async (req, res) => {
  try {
    // Only select columns that are guaranteed to exist
    const deposits = await prisma.deposit.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        method: true,
        network: true,
        asset: true,
        walletAddress: true,
        createdAt: true,
        confirmedAt: true,
        rejectedAt: true,
        rejectionReason: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ deposits });
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({ error: 'Failed to fetch deposits', details: error.message });
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
    // Query only columns that exist in the current database schema
    const deposits = await prisma.deposit.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        userId: true,
        amount: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enhance with user data
    const enhancedDeposits = await Promise.all(
      deposits.map(async (dep) => {
        const user = await prisma.user.findUnique({
          where: { id: dep.userId },
          select: { id: true, email: true, name: true }
        });
        return { ...dep, user };
      })
    );

    console.log(`✅ Found ${enhancedDeposits.length} pending deposits`);
    res.json({ deposits: enhancedDeposits });
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
    const [updatedDeposit, user, portfolio] = await prisma.$transaction(async (tx) => {
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
          spotBalance: { increment: depositAmount },  // Also update spotBalance
          history: {
            create: createHistoryEntry('deposit.confirmed', { 
              id: depositId, 
              amount: depositAmount 
            })
          }
        }
      });

      // IMPORTANT: Also update portfolio USDT to keep them in sync
      let portfolio = await tx.portfolio.findUnique({
        where: { userId: deposit.userId }
      });

      if (!portfolio) {
        portfolio = await tx.portfolio.create({
          data: {
            userId: deposit.userId,
            assets: { USDT: depositAmount }
          }
        });
      } else {
        const currentUSDT = portfolio.assets?.USDT || 0;
        portfolio = await tx.portfolio.update({
          where: { userId: deposit.userId },
          data: {
            assets: { ...portfolio.assets, USDT: currentUSDT + depositAmount }
          }
        });
      }

      return [dep, usr, portfolio];
    });

    res.json({ 
      deposit: updatedDeposit, 
      user,
      portfolio,
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

    res.json({ deposit, message: 'Deposit rejected' });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
});

export default router;
