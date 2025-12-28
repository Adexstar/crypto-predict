import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { createHistoryEntry } from '../utils/history.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Subscribe to AI Bot
router.post('/subscribe', async (req, res) => {
  try {
    const { amount, strategy, positionSize, stopLoss, takeProfit } = req.body;

    // Validate amount between 100 and 10000
    if (!amount || amount < 100 || amount > 10000) {
      return res.status(400).json({ error: 'AI subscription amount must be between $100 and $10,000' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check sufficient balance
    if (amount > user.balance) {
      return res.status(400).json({ error: 'Insufficient balance for AI subscription' });
    }

    // Calculate 150% return (profit equals the subscription amount * 1.5)
    const profit = amount * 1.5;
    
    // Update user balance: add profit without deducting subscription
    const newBalance = user.balance + profit;
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        balance: newBalance,
        history: {
          create: [
            createHistoryEntry('ai.subscription', {
              subscriptionAmount: amount,
              profit: profit,
              returnRate: '150%',
              strategy: strategy || 'moderate',
              positionSize: positionSize || 5,
              stopLoss: stopLoss || 3,
              takeProfit: takeProfit || 6
            }),
            createHistoryEntry('ai.profit', {
              profit: profit,
              returnRate: '150%',
              fromSubscription: amount
            })
          ]
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        balance: true,
        spotBalance: true,
        futuresBalance: true,
        optionsBalance: true,
        history: {
          where: { action: { startsWith: 'ai.' } },
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log('✅ AI subscription activated:', {
      userId: req.user.id,
      subscriptionAmount: amount,
      profit: profit,
      newBalance: updatedUser.balance
    });

    res.status(200).json({
      user: updatedUser,
      subscription: {
        amount,
        profit,
        totalValue: amount + profit,
        returnRate: '150%',
        strategy: strategy || 'moderate',
        message: `AI Bot activated! $${amount.toFixed(2)} subscription → $${profit.toFixed(2)} profit earned!`
      }
    });
  } catch (error) {
    console.error('AI subscription error:', error);
    res.status(500).json({ error: 'Failed to activate AI subscription', details: error.message });
  }
});

// Get AI performance history
router.get('/history', async (req, res) => {
  try {
    const aiHistory = await prisma.history.findMany({
      where: {
        userId: req.user.id,
        action: { startsWith: 'ai.' }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        message: true,
        meta: true,
        createdAt: true
      }
    });

    res.json({ history: aiHistory });
  } catch (error) {
    console.error('Failed to fetch AI history:', error);
    res.status(500).json({ error: 'Failed to fetch AI history', details: error.message });
  }
});

export default router;
