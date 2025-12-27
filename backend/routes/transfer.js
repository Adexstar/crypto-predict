import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { createHistoryEntry } from '../utils/history.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Submit transfer between accounts
router.post('/', async (req, res) => {
  try {
    const { fromAccount, toAccount, amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (fromAccount === toAccount) {
      return res.status(400).json({ error: 'From and To accounts must be different' });
    }

    const validAccounts = ['spot', 'futures', 'options'];
    if (!validAccounts.includes(fromAccount) || !validAccounts.includes(toAccount)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Check source account balance
    const sourceBalance = user[`${fromAccount}Balance`];
    if (amount > sourceBalance) {
      return res.status(400).json({ error: `Insufficient ${fromAccount} balance` });
    }

    // Perform transfer in a transaction
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        [`${fromAccount}Balance`]: { decrement: amount },
        [`${toAccount}Balance`]: { increment: amount },
        history: {
          create: createHistoryEntry('transfer.completed', {
            from: fromAccount,
            to: toAccount,
            amount
          })
        }
      },
      select: {
        id: true,
        email: true,
        balance: true,
        spotBalance: true,
        futuresBalance: true,
        optionsBalance: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'transfer',
        targetId: req.user.id,
        performedBy: req.user.email,
        details: JSON.stringify({ from: fromAccount, to: toAccount, amount })
      }
    });

    res.status(201).json({
      user: updatedUser,
      message: `Transfer of $${amount.toFixed(2)} from ${fromAccount} to ${toAccount} completed successfully`
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Failed to submit transfer', details: error.message });
  }
});

// Get user transfers
router.get('/', async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    // Get transfer history from user history
    const transfers = await prisma.history.findMany({
      where: {
        userId: req.user.id,
        action: 'transfer.completed'
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(skip),
      select: {
        id: true,
        message: true,
        meta: true,
        createdAt: true
      }
    });

    const total = await prisma.history.count({
      where: {
        userId: req.user.id,
        action: 'transfer.completed'
      }
    });

    res.json({ transfers, total, limit: parseInt(limit), skip: parseInt(skip) });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

export default router;
